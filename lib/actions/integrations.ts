'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Get the global Microsoft integration
export async function getSystemIntegration() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('system_integrations')
        .select('id, provider, expires_at, metadata, created_at, updated_at')
        .eq('provider', 'microsoft_global')
        .single()

    if (error) return null

    return {
        ...data,
        email: data.metadata?.email || 'correos@mi-hogar.cl',
    }
}

// Delete the global Microsoft integration
export async function deleteSystemIntegration() {
    const supabase = await createClient()

    const { error } = await supabase
        .from('system_integrations')
        .delete()
        .eq('provider', 'microsoft_global')

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/communications')
    return { success: true }
}

// Legacy: Get community-level integration (kept for backwards compat)
export async function getCommunityIntegration(communityId: string, provider: 'google' | 'outlook') {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('community_integrations')
        .select('id, email, provider, created_at')
        .eq('community_id', communityId)
        .eq('provider', provider)
        .single()

    if (error) return null

    return data
}

// Legacy: Delete community-level integration
export async function deleteIntegration(communityId: string, provider: 'google' | 'outlook') {
    const supabase = await createClient()

    const { error } = await supabase
        .from('community_integrations')
        .delete()
        .eq('community_id', communityId)
        .eq('provider', provider)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/communities/${communityId}/settings`)
    return { success: true }
}

export async function getAllIntegrations() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('community_integrations')
        .select('community_id, email, provider')

    if (error) {
        console.error('Error fetching all integrations:', error)
        return []
    }

    return data
}
