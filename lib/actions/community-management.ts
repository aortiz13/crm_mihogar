'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function getCommunityExportData(communityId: string) {
    const supabase = await createClient()

    // 1. Get Community Details
    const { data: community, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single()

    if (communityError || !community) {
        return { error: 'Community not found' }
    }

    // 2. Get Contacts
    const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .eq('community_id', communityId)

    if (contactsError) {
        console.error('Error fetching contacts for export:', contactsError)
        // We continue with empty contacts if error, or should we fail?
        // Let's return what we have but note the error
    }

    // 3. Get Tasks (Optional but good for full export)
    const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('community_id', communityId)

    return {
        timestamp: new Date().toISOString(),
        community,
        contacts: contacts || [],
        tasks: tasks || []
    }
}

export async function deleteCommunity(communityId: string) {
    const supabase = await createClient()

    // 0. Delete associated Communications (Emails)
    const { error: commsError } = await supabase
        .from('communications')
        .delete()
        .eq('community_id', communityId)

    if (commsError) {
        console.warn('Error deleting communications:', commsError)
    }

    // 0.5 Delete associated Documents
    const { error: docsError } = await supabase
        .from('community_documents')
        .delete()
        .eq('community_id', communityId)

    if (docsError) {
        console.warn('Error deleting community_documents:', docsError)
    }

    // 1. Delete associated Tasks
    const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('community_id', communityId)

    if (tasksError) {
        console.error('Error deleting tasks:', tasksError)
        return { error: 'Failed to delete associated tasks: ' + tasksError.message }
    }

    // 2. Delete associated Email Integrations (if any)
    const { error: integrationsError } = await supabase
        .from('integrations')
        .delete()
        .eq('community_id', communityId)

    if (integrationsError) {
        console.warn('Error deleting integrations:', integrationsError)
    }

    // 3. Delete associated Contacts
    const { error: contactsError } = await supabase
        .from('contacts')
        .delete()
        .eq('community_id', communityId)

    if (contactsError) {
        console.error('Error deleting contacts:', contactsError)
        return { error: 'Failed to delete associated contacts: ' + contactsError.message }
    }

    // 4. Finally Delete the Community
    const { error } = await supabase
        .from('communities')
        .delete()
        .eq('id', communityId)

    if (error) {
        console.error('Error deleting community:', error)
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    return { success: true }
}
