import * as msal from '@azure/msal-node'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const msalConfig: msal.Configuration = {
    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    },
}

export async function GET(req: NextRequest) {
    // Verify user is admin
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Only admins can connect the Microsoft account' }, { status: 403 })
    }

    const cca = new msal.ConfidentialClientApplication(msalConfig)

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/microsoft/callback`

    const authUrl = await cca.getAuthCodeUrl({
        scopes: ['Mail.Read', 'Mail.Send', 'Mail.ReadWrite', 'User.Read', 'offline_access'],
        redirectUri,
        prompt: 'consent',
        state: user.id, // Pass user ID as state for verification
    })

    return NextResponse.redirect(authUrl)
}
