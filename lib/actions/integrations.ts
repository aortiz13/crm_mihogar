'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
