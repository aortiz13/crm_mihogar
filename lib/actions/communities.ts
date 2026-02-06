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
