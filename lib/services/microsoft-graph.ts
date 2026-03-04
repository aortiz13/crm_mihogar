'use server'

import * as msal from '@azure/msal-node'
import { Client } from '@microsoft/microsoft-graph-client'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { decrypt, encrypt } from '@/lib/utils/encryption'

// MSAL Configuration
const msalConfig: msal.Configuration = {
    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    },
}

const SCOPES = ['Mail.Read', 'Mail.Send', 'Mail.ReadWrite', 'User.Read', 'offline_access']

const cca = new msal.ConfidentialClientApplication(msalConfig)

// ============================================================
// Token Management
// ============================================================

export async function getSystemTokens() {
    const supabase = await createSupabaseClient()
    const { data } = await supabase
        .from('system_integrations')
        .select('*')
        .eq('provider', 'microsoft_global')
        .single()

    if (!data) return null

    return {
        ...data,
        access_token: data.access_token ? decrypt(data.access_token) : null,
        refresh_token: data.refresh_token ? decrypt(data.refresh_token) : null,
    }
}

async function refreshAndSaveToken(refreshToken: string) {
    const tokenRequest: msal.RefreshTokenRequest = {
        refreshToken,
        scopes: SCOPES,
    }

    const response = await cca.acquireTokenByRefreshToken(tokenRequest)

    if (!response) throw new Error('Failed to refresh token')

    const supabase = await createSupabaseClient()

    const updatePayload: Record<string, any> = {
        access_token: encrypt(response.accessToken),
        expires_at: response.expiresOn?.toISOString(),
        updated_at: new Date().toISOString(),
    }

    // MSAL may return a new refresh token during rotation
    if ((response as any).refreshToken) {
        updatePayload.refresh_token = encrypt((response as any).refreshToken)
    }

    await supabase
        .from('system_integrations')
        .update(updatePayload)
        .eq('provider', 'microsoft_global')

    return response.accessToken
}

// ============================================================
// Graph Client
// ============================================================

export async function getGraphClient() {
    const tokens = await getSystemTokens()
    if (!tokens || !tokens.access_token) return null

    let accessToken = tokens.access_token

    // Check if token is expired or about to expire (5 min buffer)
    if (tokens.expires_at) {
        const expiresAt = new Date(tokens.expires_at).getTime()
        const now = Date.now()
        const fiveMinutes = 5 * 60 * 1000

        if (now >= expiresAt - fiveMinutes) {
            if (!tokens.refresh_token) {
                console.error('[Graph] Token expired and no refresh token available')
                return null
            }
            try {
                accessToken = await refreshAndSaveToken(tokens.refresh_token)
            } catch (e) {
                console.error('[Graph] Token refresh failed:', e)
                return null
            }
        }
    }

    const client = Client.init({
        authProvider: (done) => {
            done(null, accessToken)
        },
    })

    return client
}

// ============================================================
// Email Operations
// ============================================================

export async function syncEmails() {
    const client = await getGraphClient()
    if (!client) return { error: 'No Microsoft integration configured' }

    const supabase = await createSupabaseClient()
    const tokens = await getSystemTokens()

    try {
        let url = '/me/mailFolders/inbox/messages'
        let queryParams: Record<string, string> = {
            '$top': '25',
            '$orderby': 'receivedDateTime desc',
            '$select': 'id,conversationId,subject,bodyPreview,body,from,toRecipients,receivedDateTime,isRead,hasAttachments',
        }

        // Use delta link for incremental sync if available
        if (tokens?.delta_link) {
            // Delta links include their own parameters
            url = tokens.delta_link
            queryParams = {}
        }

        let request = client.api(url)
        if (Object.keys(queryParams).length > 0) {
            for (const [key, value] of Object.entries(queryParams)) {
                request = request.query({ [key]: value })
            }
        }

        const response = await request.get()
        const messages = response.value || []

        console.log(`[Microsoft Sync] Found ${messages.length} messages`)

        let newCount = 0

        for (const msg of messages) {
            // Check if already exists
            const { data: existing } = await supabase
                .from('communications')
                .select('id')
                .eq('microsoft_message_id', msg.id)
                .single()

            if (existing) continue

            const senderEmail = msg.from?.emailAddress?.address || ''
            const senderName = msg.from?.emailAddress?.name || senderEmail

            // AI Classification - determine which community this email belongs to
            const classification = await classifyEmail(senderEmail, senderName, msg.subject || '')

            const { error: insertError } = await supabase.from('communications').insert({
                community_id: classification.community_id,
                subject: msg.subject || 'Sin Asunto',
                sender_email: senderEmail,
                sender_name: senderName,
                body: msg.body?.content || msg.bodyPreview || '',
                status: 'new',
                direction: 'incoming',
                received_at: msg.receivedDateTime || new Date().toISOString(),
                thread_id: msg.conversationId || null,
                conversation_id: msg.conversationId || null,
                microsoft_message_id: msg.id,
                metadata: {
                    has_attachments: msg.hasAttachments,
                    is_read: msg.isRead,
                    to_recipients: msg.toRecipients?.map((r: any) => r.emailAddress?.address),
                },
                ai_metadata: classification,
                raw_email_data: {
                    from: msg.from,
                    to: msg.toRecipients,
                    bodyPreview: msg.bodyPreview,
                },
            })

            if (insertError) {
                console.error('[Microsoft Sync] Insert error:', insertError)
            } else {
                newCount++
            }
        }

        // Save delta link for next incremental sync
        if (response['@odata.deltaLink']) {
            await supabase
                .from('system_integrations')
                .update({
                    delta_link: response['@odata.deltaLink'],
                    updated_at: new Date().toISOString(),
                })
                .eq('provider', 'microsoft_global')
        }

        return { success: true, total: messages.length, new: newCount }
    } catch (e: any) {
        console.error('[Microsoft Sync] Error:', e)
        return { error: e.message || 'Sync failed' }
    }
}

export async function sendEmail(options: {
    to: string
    subject: string
    body: string
    communityId?: string
}) {
    const client = await getGraphClient()
    if (!client) return { error: 'No Microsoft integration configured' }

    const { to, subject, body } = options

    try {
        await client.api('/me/sendMail').post({
            message: {
                subject,
                body: {
                    contentType: 'HTML',
                    content: body,
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: to,
                        },
                    },
                ],
            },
            saveToSentItems: true,
        })

        return { success: true }
    } catch (e: any) {
        console.error('[Microsoft Send] Error:', e)
        return { error: e.message || 'Send failed' }
    }
}

// ============================================================
// AI Email Classification
// ============================================================

async function classifyEmail(
    senderEmail: string,
    senderName: string,
    subject: string
): Promise<{
    community_id: string | null
    contact_id: string | null
    confidence: number
    reasoning: string
    method: string
}> {
    const supabase = await createSupabaseClient()

    // Step 1: Try to match by sender email in contacts
    if (senderEmail) {
        const { data: contact } = await supabase
            .from('contacts')
            .select('id, community_id, full_name')
            .eq('email', senderEmail.toLowerCase())
            .single()

        if (contact && contact.community_id) {
            return {
                community_id: contact.community_id,
                contact_id: contact.id,
                confidence: 0.95,
                reasoning: `Matched sender ${senderEmail} to contact ${contact.full_name}`,
                method: 'email_match',
            }
        }

        // Also check if this email was previously classified
        const { data: previousEmail } = await supabase
            .from('communications')
            .select('community_id, ai_metadata')
            .eq('sender_email', senderEmail)
            .not('community_id', 'is', null)
            .order('received_at', { ascending: false })
            .limit(1)
            .single()

        if (previousEmail?.community_id) {
            return {
                community_id: previousEmail.community_id,
                contact_id: null,
                confidence: 0.85,
                reasoning: `Sender ${senderEmail} was previously classified to this community`,
                method: 'historical_match',
            }
        }
    }

    // Step 2: Try AI classification using Gemini
    try {
        const { data: communities } = await supabase
            .from('communities')
            .select('id, name, address')

        if (communities && communities.length > 0) {
            const { GoogleGenerativeAI } = await import('@google/generative-ai')
            const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY || '')

            const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

            const communityList = communities
                .map((c) => `- ID: ${c.id}, Nombre: "${c.name}", Dirección: "${c.address || 'N/A'}"`)
                .join('\n')

            const prompt = `Eres un asistente de clasificación de correos para una administradora de condominios.
Analiza el siguiente correo y determina a cuál comunidad pertenece.

Comunidades disponibles:
${communityList}

Correo recibido:
- De: ${senderName} <${senderEmail}>
- Asunto: ${subject}

Responde SOLO con un JSON válido (sin markdown, sin backticks):
{"community_id": "uuid_de_la_comunidad_o_null", "confidence": 0.0_a_1.0, "reasoning": "explicación breve"}

Si no puedes determinar la comunidad con confianza, usa null como community_id.`

            const result = await model.generateContent(prompt)
            const text = result.response.text().trim()

            // Parse AI response
            const jsonMatch = text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                const aiResult = JSON.parse(jsonMatch[0])
                return {
                    community_id: aiResult.community_id || null,
                    contact_id: null,
                    confidence: aiResult.confidence || 0.5,
                    reasoning: aiResult.reasoning || 'AI classification',
                    method: 'ai_gemini',
                }
            }
        }
    } catch (e) {
        console.error('[AI Classify] Error:', e)
    }

    // Step 3: Fallback - unclassified
    return {
        community_id: null,
        contact_id: null,
        confidence: 0,
        reasoning: 'Could not determine community from sender or subject',
        method: 'unclassified',
    }
}
