'use server'

import { createClient } from '@/lib/supabase/server'
import { Activity } from '@/types'
import { revalidatePath } from 'next/cache'

export async function getContactActivities(contactId: string): Promise<Activity[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contact activities:', error)
        return []
    }

    return data as Activity[]
}

export async function getCommunityActivities(communityId: string): Promise<Activity[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching community activities:', error)
        return []
    }

    return data as Activity[]
}

export async function createActivity(activity: Omit<Activity, 'id' | 'created_at'>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('activities')
        .insert(activity)

    if (error) {
        console.error('Error creating activity:', error)
        return { error: error.message }
    }

    revalidatePath(`/dashboard/contactos/${activity.contact_id}`)
    revalidatePath(`/dashboard/communities/${activity.community_id}`)
    return { success: true }
}
