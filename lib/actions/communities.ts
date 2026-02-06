'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Community } from '@/types'

export async function getCommunities(): Promise<Community[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('communities')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching communities:', error)
        return []
    }

    return data as Community[]
}

export async function getCommunity(id: string): Promise<Community | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching community:', JSON.stringify(error, null, 2))
        return null
    }

    return data as Community
}

export async function createCommunity(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const address = formData.get('address') as string
    const unit_count = formData.get('unit_count') ? parseInt(formData.get('unit_count') as string) : null
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null

    // Parse bank data if present (for future-proofing, though not in the simple form yet)
    const bank_data = {
        bank_name: formData.get('bank_name') as string || '',
        account_type: formData.get('account_type') as string || '',
        account_number: formData.get('account_number') as string || '',
        rut: formData.get('rut') as string || '',
        email: formData.get('bank_email') as string || '',
    }

    const { error } = await supabase
        .from('communities')
        .insert({
            name,
            address,
            unit_count,
            bank_data,
            latitude,
            longitude
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/communities')
    return { success: true }
}

export async function updateCommunityBankData(id: string, bankData: any) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('communities')
        .update({
            bank_data: bankData
        })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/communities/${id}`)
    return { success: true }
}

export async function updateCommunity(id: string, updates: Partial<Community>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('communities')
        .update(updates)
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/communities/${id}`)
    return { success: true }
}

export async function updateCommunityEmailSettings(id: string, settings: any) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('communities')
        .update({
            email_provider: settings.email_provider,
            smtp_host: settings.smtp_host,
            smtp_port: settings.smtp_port ? parseInt(settings.smtp_port) : null,
            smtp_user: settings.smtp_user,
            smtp_pass: settings.smtp_pass,
            gmail_access_token: settings.gmail_access_token,
        })
        .eq('id', id)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/communities/${id}/settings`)
    return { success: true }
}

async function geocodeAddress(address: string, city: string) {
    try {
        const query = encodeURIComponent(`${address}, ${city}`)
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
            headers: {
                'User-Agent': 'MiHogarCRM/1.0'
            }
        })
        const data = await response.json()
        if (data && data.length > 0) {
            return {
                latitude: parseFloat(data[0].lat),
                longitude: parseFloat(data[0].lon),
                display_name: data[0].display_name,
                geo_status: 'completed' as const
            }
        }
        return { geo_status: 'pending' as const }
    } catch (error) {
        console.error('Geocoding error:', error)
        return { geo_status: 'error' as const }
    }
}

export async function bulkImportCommunities(
    data: any[],
    mapping: Record<string, string>,
    options: { updateIfExists: boolean }
) {
    const supabase = await createClient()
    const results = { imported: 0, skipped: 0, errors: 0 }

    for (const row of data) {
        try {
            const mappedRow: any = {}
            Object.entries(mapping).forEach(([excelHeader, dbField]) => {
                if (dbField) mappedRow[dbField] = row[excelHeader]
            })

            if (!mappedRow.name || !mappedRow.address) {
                results.errors++
                continue
            }

            // Deduplication
            const { data: existing } = await supabase
                .from('communities')
                .select('id')
                .or(`name.eq."${mappedRow.name}",address.eq."${mappedRow.address}"`)
                .maybeSingle()

            if (existing) {
                if (options.updateIfExists) {
                    const { error } = await supabase
                        .from('communities')
                        .update(mappedRow)
                        .eq('id', existing.id)
                    if (error) results.errors++
                    else results.imported++
                } else {
                    results.skipped++
                }
                continue
            }

            // Geocoding
            const geo = await geocodeAddress(mappedRow.address, mappedRow.city || '')

            const { error } = await supabase
                .from('communities')
                .insert({
                    ...mappedRow,
                    ...geo
                })

            if (error) {
                console.error('Error inserting community:', error)
                results.errors++
            } else {
                results.imported++
            }
        } catch (err) {
            console.error('Row processing error:', err)
            results.errors++
        }
    }

    revalidatePath('/dashboard/communities')
    return { success: true, ...results }
}
