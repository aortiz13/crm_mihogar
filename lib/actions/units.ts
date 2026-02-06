'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Unit, UnitContact } from '@/types'

export async function getUnits(communityId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('community_id', communityId)
        .order('unit_number', { ascending: true })

    if (error) return { error: error.message }
    return { data: data as Unit[] }
}

export async function getUnit(unitId: number) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('units')
        .select(`
            *,
            contact_relations:unit_contacts(
                *,
                contact:contacts(*)
            )
        `)
        .eq('id', unitId)
        .single()

    if (error) return { error: error.message }
    return { data: data as Unit }
}

export async function linkContactToUnit(payload: {
    unit_id: number,
    contact_id: string,
    role: string,
    is_primary_payer?: boolean,
    start_date?: string
}) {
    const supabase = await createClient()

    // If setting as primary payer, unset others for this unit first
    if (payload.is_primary_payer) {
        await supabase
            .from('unit_contacts')
            .update({ is_primary_payer: false })
            .eq('unit_id', payload.unit_id)
    }

    const { error } = await supabase
        .from('unit_contacts')
        .upsert({
            unit_id: payload.unit_id,
            contact_id: payload.contact_id,
            role: payload.role,
            is_primary_payer: !!payload.is_primary_payer,
            is_active: true,
            start_date: payload.start_date || new Date().toISOString().split('T')[0]
        }, { onConflict: 'unit_id, contact_id' })

    if (error) return { error: error.message }

    revalidatePath(`/dashboard/communities`)
    return { success: true }
}

export async function unlinkContactFromUnit(unitId: number, contactId: string, deactivateOnly = true) {
    const supabase = await createClient()

    if (deactivateOnly) {
        const { error } = await supabase
            .from('unit_contacts')
            .update({
                is_active: false,
                end_date: new Date().toISOString().split('T')[0],
                is_primary_payer: false
            })
            .eq('unit_id', unitId)
            .eq('contact_id', contactId)

        if (error) return { error: error.message }
    } else {
        const { error } = await supabase
            .from('unit_contacts')
            .delete()
            .eq('unit_id', unitId)
            .eq('contact_id', contactId)

        if (error) return { error: error.message }
    }

    revalidatePath(`/dashboard/communities`)
    return { success: true }
}

export async function getContactUnits(contactId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('unit_contacts')
        .select(`
            *,
            unit:units(
                *,
                communities(name)
            )
        `)
        .eq('contact_id', contactId)
        .order('is_active', { ascending: false })

    if (error) return { error: error.message }
    return { data: data as UnitContact[] }
}
