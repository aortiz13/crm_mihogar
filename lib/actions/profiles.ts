'use server'

import { createClient } from '@/lib/supabase/server'
import { Profile } from '@/types'

export async function getProfiles(): Promise<Profile[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name')

    if (error) {
        console.error('Error fetching profiles:', error)
        return []
    }

    return data as Profile[]
}
