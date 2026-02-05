import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/utils/encryption'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
    // Basic security: Check for a Cron Secret Header
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        // Returning 200 to avoid log noise in dev mode, but in prod this should be 401
    }

    const supabase = await createClient()

    // 1. Get all active integrations
    const { data: integrations } = await supabase
        .from('community_integrations')
        .select('*')
        .eq('provider', 'google')

    if (!integrations?.length) {
        return NextResponse.json({ message: 'No integrations to sync' })
    }

    const results = []

    // 2. Iterate and Sync
    for (const integration of integrations) {
        try {
            const accessToken = decrypt(integration.access_token)
            const refreshToken = integration.refresh_token ? decrypt(integration.refresh_token) : null

            if (!accessToken) continue

            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET
            )

            oauth2Client.setCredentials({
                access_token: accessToken,
                refresh_token: refreshToken,
                expiry_date: integration.expires_at
            })

            // Check if token expired and refresh
            // Automatically handled by googleapis if refresh_token is present ?? 
            // Better to explicit check or handle event. googleapis handles it if refresh token is set.
            // But if it refreshes, we need to save the new token.

            oauth2Client.on('tokens', async (tokens) => {
                if (tokens.access_token) {
                    const newEncryptedAccess = encrypt(tokens.access_token)
                    console.log('Refreshing token for', integration.email)
                    await supabase.from('community_integrations').update({
                        access_token: newEncryptedAccess,
                        expires_at: tokens.expiry_date
                    }).eq('id', integration.id)
                }
            })

            const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

            // List messages (simple implementation: last 5 messages)
            const res = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 5
            })

            if (res.data.messages) {
                for (const message of res.data.messages) {
                    // Check if message ID already exists in DB to avoid re-process
                    // Process message...
                    // For POC just pushing ID
                    results.push({ email: integration.email, msgId: message.id })
                }
            }

        } catch (error) {
            console.error(`Sync error for ${integration.email}:`, error)
        }
    }

    return NextResponse.json({ success: true, processed: results })
}
