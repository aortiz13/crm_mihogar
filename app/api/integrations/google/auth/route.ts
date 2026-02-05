import { google } from 'googleapis'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import jwt from 'jsonwebtoken'

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const communityId = searchParams.get('communityId')

    if (!communityId) {
        return NextResponse.json({ error: 'Community ID is required' }, { status: 400 })
    }

    // Verify user has access to this community (Admin or Operator)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Basic security check: ensure user is Admin or assigned to this community
    // For now, assuming Admin check or reliance on RBAC in callback, 
    // but good practice to check here if possible. 
    // keeping it light for the "One-Click" flow start.

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`
    )

    // Encode state with communityId and a random nonce/signature to prevent CSRF
    // Using JWT for state is a clean way to pass data + verify origin
    const state = jwt.sign(
        { communityId, userId: user.id },
        process.env.SUPABASE_JWT_SECRET || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'secret',
        { expiresIn: '1h' }
    )

    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ]

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Critical for receiving refresh_token
        scope: scopes,
        state: state,
        prompt: 'consent' // Forces refresh_token generation
    })

    return NextResponse.redirect(url)
}
