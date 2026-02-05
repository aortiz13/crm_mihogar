'use server'

import { createClient } from '@/lib/supabase/server'

export interface Email {
    id: string
    subject: string
    sender_email: string
    sender_name: string | null
    project_preview: string
    received_at: string
    status: 'new' | 'pending' | 'resolved'
    body: string
    ai_summary: string | null
    thread_id: string | null
    community_id: string | null
    metadata: any | null
    type?: 'incoming' | 'outgoing' // Virtual or provided by metadata
}

export async function getEmails(filters?: { communityId?: string, folder?: string }) {
    const supabase = await createClient()

    let query = supabase
        .from('communications')
        .select('*')
        .order('received_at', { ascending: false })

    if (filters?.communityId) {
        query = query.eq('community_id', filters.communityId)
    }

    // Folder logic mapping
    if (filters?.folder) {
        if (filters.folder === 'pending' || filters.folder === 'new') {
            query = query.in('status', ['new', 'pending'])
        } else if (filters.folder === 'resolved') {
            query = query.eq('status', 'resolved')
        }
        // 'trash' or others could be added if schema supports it
    } else {
        // Default to pending/new if no folder specified? Or all?
        // Matching previous logic: default was pending/new
        query = query.in('status', ['new', 'pending'])
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching emails:', error)
        return []
    }

    return data as Email[]
}

export async function getEmail(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching email:', error)
        return null
    }

    return data as Email
}

export async function markAsResolved(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('communications')
        .update({ status: 'resolved' })
        .eq('id', id)

    if (!error) {
        revalidatePath('/dashboard/communications')
    }
    return { error: error?.message }
}

export async function getThreadMessages(threadId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('communications')
        .select('*')
        .eq('thread_id', threadId)
        .order('received_at', { ascending: true }) // Oldest first for thread history

    if (error) {
        console.error('Error fetching thread:', error)
        return []
    }

    return data as Email[]
}

import { syncEmailsForCommunity, sendEmail as sendGmail } from '@/lib/services/gmail'
import { revalidatePath } from 'next/cache'

export async function syncMessages(communityId: string) {
    const res = await syncEmailsForCommunity(communityId)
    revalidatePath('/dashboard/communications')
    return res
}

export async function sendReply(communityId: string, to: string, subject: string, body: string) {
    // Reuse the generic sending logic but maybe mark as resolved or keep consistent
    return sendNewEmail({ communityId, to, subject, body })
}

export async function sendNewEmail(params: {
    communityId: string;
    fromEmail?: string;
    to: string;
    subject: string;
    body: string;
    attachmentContent?: string;
    attachmentName?: string;
}) {
    const supabase = await createClient()

    // 1. Send via Gmail/SMTP service
    try {
        await sendGmail(params.communityId, {
            to: params.to,
            subject: params.subject,
            body: params.body,
            from: params.fromEmail // Pass custom from if provided
        })
    } catch (error) {
        console.error('Error sending email via service:', error)
        return { error: 'Failed to send email' }
    }

    // 2. Save to Database
    // We might not have a thread_id yet if it's a new email, or Gmail API response might give it.
    // The sendGmail service currently returns { success: true } or error. 
    // Ideally sendGmail should return the 'id' and 'threadId' of the sent message if possible, 
    // but standard GMail send API returns them. `lib/services/gmail.ts` needs to return them.
    // For now, we save it as a local record. syncMessages will likely pick it up later or duplicately, 
    // but it's better to show it immediately.

    const { error: insertError } = await supabase.from('communications').insert({
        community_id: params.communityId,
        subject: params.subject,
        body: params.body,
        sender_name: 'Yo (Enviado)',
        sender_email: 'me',
        received_at: new Date().toISOString(),
        status: 'resolved',
        metadata: { type: 'outgoing', to: params.to, from_custom: params.fromEmail }
    })

    if (insertError) {
        console.error('Error saving sent email:', insertError)
    }

    revalidatePath('/dashboard/communications')
    return { success: true }
}
