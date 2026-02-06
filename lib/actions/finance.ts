'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { FinancePeriod, Unit, FinanceChargeDetail, FinanceExpense } from '@/types'
import * as XLSX from 'xlsx'

export async function getFinancePeriods(communityId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('finance_periods')
        .select('*')
        .eq('community_id', communityId)
        .order('year', { ascending: false })
        .order('month', { ascending: false })

    if (error) return { error: error.message }
    return { data: data as FinancePeriod[] }
}

export async function createFinancePeriod(communityId: string, month: number, year: number) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('finance_periods')
        .insert({ community_id: communityId, month, year })
        .select()
        .single()

    if (error) return { error: error.message }
    revalidatePath(`/dashboard/communities/${communityId}`)
    return { data: data as FinancePeriod }
}

export async function getUnits(communityId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('community_id', communityId)

    if (error) return { error: error.message }
    return { data: data as Unit[] }
}

export async function createUnitsBatch(communityId: string, unitNumbers: string[]) {
    const supabase = await createClient()
    const inserts = unitNumbers.map(num => ({ community_id: communityId, unit_number: num }))
    const { error } = await supabase.from('units').upsert(inserts, { onConflict: 'community_id, unit_number' })
    if (error) return { error: error.message }
    return { success: true }
}

/**
 * processFinanceExcel
 * Pivots wide Excel data (One row per unit, columns for concepts) into long format
 */
export async function processFinanceExcel(
    periodId: number,
    communityId: string,
    fileBase64: string,
    mapping: { unitCol: string; conceptCols: string[]; totalCol?: string }
) {
    const supabase = await createClient()

    // 1. Load units for this community to map unit_number to unit_id
    const { data: units } = await getUnits(communityId)
    if (!units) return { error: 'No se pudieron cargar las unidades' }
    const unitMap = new Map(units.map(u => [u.unit_number.toLowerCase().trim(), u.id]))

    // 2. Parse Excel
    const buffer = Buffer.from(fileBase64, 'base64')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[]

    const chargeDetails: any[] = []
    const missingUnits: string[] = []
    const validationErrors: string[] = []
    let totalBilled = 0

    // 3. Transform (Melt/Pivot)
    for (const row of jsonData) {
        const unitLabel = String(row[mapping.unitCol] || '').toLowerCase().trim()
        const unitId = unitMap.get(unitLabel)

        if (!unitId) {
            if (unitLabel && !missingUnits.includes(unitLabel)) {
                missingUnits.push(unitLabel)
            }
            continue
        }

        let unitTotalSum = 0
        for (const concept of mapping.conceptCols) {
            const amount = parseFloat(row[concept])
            if (!isNaN(amount) && amount !== 0) {
                chargeDetails.push({
                    period_id: periodId,
                    unit_id: unitId,
                    concept_name: concept,
                    amount: amount,
                    source_column: concept
                })
                unitTotalSum += amount
                totalBilled += amount
            }
        }

        // Integrity Check
        if (mapping.totalCol) {
            const expectedTotal = parseFloat(row[mapping.totalCol])
            if (!isNaN(expectedTotal) && Math.abs(unitTotalSum - expectedTotal) > 0.01) {
                validationErrors.push(`Unidad ${unitLabel}: Suma conceptos ($${unitTotalSum.toFixed(2)}) != Total Excel ($${expectedTotal.toFixed(2)})`)
            }
        }
    }

    if (chargeDetails.length === 0) {
        return { error: 'No se detectaron cobros válidos en el archivo' }
    }

    // 4. Batch Insert
    const { error: insertError } = await supabase
        .from('finance_charge_details')
        .insert(chargeDetails)

    if (insertError) return { error: insertError.message }

    // 5. Update period summary
    await supabase.from('finance_periods').update({ total_billed: totalBilled }).eq('id', periodId)

    return {
        success: true,
        insertedCount: chargeDetails.length,
        missingUnits: missingUnits.length > 0 ? missingUnits : null,
        validationErrors: validationErrors.length > 0 ? validationErrors : null
    }
}

/**
 * Tool for AI to lookup bill details
 */
export async function getResidentBill(email: string, month: number, year: number) {
    const supabase = await createClient()

    const { data: details, error } = await supabase
        .from('finance_charge_details')
        .select(`
            concept_name,
            amount,
            units!inner(resident_email, unit_number),
            finance_periods!inner(month, year)
        `)
        .eq('units.resident_email', email)
        .eq('finance_periods.month', month)
        .eq('finance_periods.year', year)

    if (error) return { error: error.message }
    return { data: details }
}
