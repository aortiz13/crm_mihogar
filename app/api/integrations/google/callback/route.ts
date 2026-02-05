import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/utils/encryption'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
        return NextResponse.json({ error: 'Missing code or state' }, { status: 400 })
    }

    try {
        // Decode state
        const decoded = jwt.verify(
            state,
            process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'secret'
        ) as { communityId: string, userId: string }

        const { communityId } = decoded

        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
        )

        const { tokens } = await oauth2Client.getToken(code)
        oauth2Client.setCredentials(tokens)

        // Get user profile
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
        const { data: profile } = await oauth2.userinfo.get()

        if (!profile.email) {
            throw new Error('No email found in Google Profile')
        }

        // Encrypt tokens
        const encryptedAccessToken = encrypt(tokens.access_token!)
        const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null

        // Save to DB
        // Note: "supabase-js" client might not support direct insert if table RLS is strict and we act as user.
        // We generally want to use a SERVICE_ROLE client here to ensure we can write to this potentially protected table,
        // OR ensure the user has 'admin' rights via specific RLS.
        // Assuming 'supabase/server' uses cookie auth, so acting as the logged-in user.
        const supabase = await createClient()

        // Ensure table exists via SQL editor before running this.
        const payload: any = {
            community_id: communityId,
            provider: 'google',
            email: profile.email,
            access_token: encryptedAccessToken,
            scopes: tokens.scope ? JSON.stringify(tokens.scope.split(' ')) : [],
            expires_at: tokens.expiry_date,
            updated_at: new Date().toISOString()
        }

        if (encryptedRefreshToken) {
            payload.refresh_token = encryptedRefreshToken
        }

        const { error } = await supabase
            .from('community_integrations')
            .upsert(payload, { onConflict: 'community_id,provider' })

        if (error) {
            console.error('DB Error:', error)
            return NextResponse.json({ error: 'Failed to save integration' }, { status: 500 })
        }

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/communities/${communityId}/settings?success=true`)

    } catch (error) {
        console.error('OAuth Error:', error)
        return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
    }
}
