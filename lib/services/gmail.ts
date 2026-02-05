import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { decrypt, encrypt } from '@/lib/utils/encryption'

// Helper to get Authenticated Gmail Client
export async function getGmailClient(communityId: string) {
    const supabase = await createClient()

    const { data: integration } = await supabase
        .from('community_integrations')
        .select('*')
        .eq('community_id', communityId)
        .eq('provider', 'google')
        .single()

    if (!integration) return null

    const accessToken = decrypt(integration.access_token)
    const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : null

    if (!accessToken) return null

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: integration.expires_at
    })

    // Handle Token Refresh automatically
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            const newEncryptedAccess = encrypt(tokens.access_token)
            const updatePayload: any = {
                access_token: newEncryptedAccess,
                expires_at: tokens.expiry_date
            }
            if (tokens.refresh_token) {
                updatePayload.refresh_token = encrypt(tokens.refresh_token)
            }
            await supabase.from('community_integrations').update(updatePayload).eq('id', integration.id)
        }
    })

    return google.gmail({ version: 'v1', auth: oauth2Client })
}

export async function syncEmailsForCommunity(communityId: string) {
    const gmail = await getGmailClient(communityId)
    if (!gmail) return { error: 'No integration found' }

    const supabase = await createClient()

    try {
        const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10,
            labelIds: ['INBOX']
        })

        const messages = res.data.messages || []
        console.log(`[Sync] Found ${messages.length} messages for community ${communityId}`)

        if (messages.length > 0) {
            for (const msg of messages) {
                // Check if exists
                const existing = await supabase
                    .from('communications')
                    .select('id')
                    .eq('thread_id', msg.threadId)
                    .eq('metadata->>gmail_id', msg.id)
                    .single()

                if (existing.data) {
                    continue
                }

                console.log(`[Sync] Processing new message ${msg.id}`)
                // Fetch full message
                const fullMsg = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id!,
                    format: 'full'
                })

                const headers = fullMsg.data.payload?.headers
                const subject = headers?.find(h => h.name === 'Subject')?.value || 'Sin Asunto'
                const from = headers?.find(h => h.name === 'From')?.value || ''
                // Simple parsing of From "Name <email>"
                const fromMatch = from.match(/(.*)<(.*)>/)
                const senderName = fromMatch ? fromMatch[1].trim() : from
                const senderEmail = fromMatch ? fromMatch[2].trim() : from

                const date = headers?.find(h => h.name === 'Date')?.value

                // Body extraction (simplified)
                let body = ''
                if (fullMsg.data.payload?.body?.data) {
                    body = Buffer.from(fullMsg.data.payload.body.data, 'base64').toString()
                } else if (fullMsg.data.payload?.parts) {
                    // recursively find text/plain
                    const findBody = (parts: any[]): string => {
                        for (const part of parts) {
                            if (part.mimeType === 'text/plain' && part.body?.data) {
                                return Buffer.from(part.body.data, 'base64').toString()
                            }
                            if (part.parts) return findBody(part.parts)
                        }
                        return ''
                    }
                    body = findBody(fullMsg.data.payload.parts)
                }

                // Insert into Communications
                const { error: insertError } = await supabase.from('communications').insert({
                    community_id: communityId,
                    subject,
                    sender_email: senderEmail,
                    sender_name: senderName.replace(/"/g, ''),
                    body,
                    status: 'new',
                    received_at: date ? new Date(date).toISOString() : new Date().toISOString(),
                    thread_id: msg.threadId,
                    metadata: { gmail_id: msg.id, snippet: fullMsg.data.snippet }
                })

                if (insertError) {
                    console.error('Insert Error', insertError)
                    return { error: `Insert failed: ${insertError.message}` }
                }
            }
        }
        return { success: true, count: messages.length }
    } catch (e: any) {
        console.error('Sync Error', e)
        return { error: e.message }
    }
}

export async function sendEmail(communityId: string, options: { to: string, subject: string, body: string, from?: string }) {
    const gmail = await getGmailClient(communityId)
    if (!gmail) return { error: 'No integration found' }

    const { to, subject, body, from } = options

    // Construct raw email
    const headers = [
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        `Content-Transfer-Encoding: 7bit`,
        `to: ${to}`,
        `subject: ${subject}`
    ]

    if (from) {
        headers.push(`from: ${from}`)
    }

    const str = headers.join('\n') + '\n\n' + body

    const encodedMail = Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMail
            }
        })
        return { success: true }
    } catch (e: any) {
        return { error: e.message }
    }
}
