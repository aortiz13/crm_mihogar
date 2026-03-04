'use server'

import { createClient } from '@/lib/supabase/server'
import { createActivity } from './activities'
import { syncEmails as syncMicrosoftEmails, sendEmail as sendMicrosoftEmail } from '@/lib/services/microsoft-graph'
import { revalidatePath } from 'next/cache'

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
    type?: 'incoming' | 'outgoing'
    direction?: 'incoming' | 'outgoing'
    microsoft_message_id?: string | null
    conversation_id?: string | null
    ai_metadata?: any | null
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
        } else if (filters.folder === 'unclassified') {
            query = query.is('community_id', null)
        }
    } else {
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
        .eq('conversation_id', threadId)
        .order('received_at', { ascending: true })

    if (error) {
        console.error('Error fetching thread:', error)
        return []
    }

    return data as Email[]
}

// Unified sync - no longer needs communityId
export async function syncMessages() {
    const res = await syncMicrosoftEmails()
    revalidatePath('/dashboard/communications')
    return res
}

export async function sendReply(to: string, subject: string, body: string, communityId?: string) {
    return sendNewEmail({ to, subject, body, communityId })
}

export async function sendNewEmail(params: {
    communityId?: string;
    to: string;
    subject: string;
    body: string;
}) {
    const supabase = await createClient()

    // 1. Send via Microsoft Graph API
    const sendResult = await sendMicrosoftEmail({
        to: params.to,
        subject: params.subject,
        body: params.body,
        communityId: params.communityId,
    })

    if ('error' in sendResult) {
        console.error('Error sending email via Microsoft:', sendResult.error)
        return { error: 'Failed to send email' }
    }

    // 2. Save to Database as outgoing record
    const { error: insertError, data: sentEmail } = await supabase.from('communications').insert({
        community_id: params.communityId || null,
        subject: params.subject,
        body: params.body,
        sender_name: 'correos@mi-hogar.cl',
        sender_email: 'correos@mi-hogar.cl',
        received_at: new Date().toISOString(),
        status: 'resolved',
        direction: 'outgoing',
        metadata: { type: 'outgoing', to: params.to },
    }).select().single()

    if (!insertError && sentEmail) {
        await createActivity({
            type: 'email_out',
            community_id: params.communityId || '',
            contact_id: null,
            title: 'Email Enviado',
            description: `Asunto: ${params.subject} | Para: ${params.to}`,
            metadata: { communication_id: sentEmail.id, to: params.to },
        })
    }

    if (insertError) {
        console.error('Error saving sent email:', insertError)
    }

    revalidatePath('/dashboard/communications')
    return { success: true }
}

// Assign a community to an unclassified email
export async function assignCommunity(emailId: string, communityId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('communications')
        .update({
            community_id: communityId,
            ai_metadata: {
                method: 'manual_assignment',
                confidence: 1.0,
                reasoning: 'Manually assigned by user',
            },
        })
        .eq('id', emailId)

    if (!error) {
        revalidatePath('/dashboard/communications')
    }
    return { error: error?.message }
}
