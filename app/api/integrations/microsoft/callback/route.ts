import * as msal from '@azure/msal-node'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encrypt } from '@/lib/utils/encryption'

const msalConfig: msal.Configuration = {
    auth: {
        clientId: process.env.MICROSOFT_CLIENT_ID!,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
        authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    },
}

export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
        console.error('[Microsoft OAuth] Error:', error, errorDescription)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/communications?error=${encodeURIComponent(errorDescription || error)}`
        )
    }

    if (!code) {
        return NextResponse.json({ error: 'Missing authorization code' }, { status: 400 })
    }

    try {
        const cca = new msal.ConfidentialClientApplication(msalConfig)
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/microsoft/callback`

        const tokenResponse = await cca.acquireTokenByCode({
            code,
            scopes: ['Mail.Read', 'Mail.Send', 'Mail.ReadWrite', 'User.Read', 'offline_access'],
            redirectUri,
        })

        if (!tokenResponse) {
            throw new Error('No token response received')
        }

        // Get connected account email
        const accountEmail = tokenResponse.account?.username || 'correos@mi-hogar.cl'

        // Encrypt tokens
        const encryptedAccessToken = encrypt(tokenResponse.accessToken)
        // MSAL v2 stores refresh tokens internally, but we also persist
        // The refresh token is available in the token cache
        const cacheContent = cca.getTokenCache().serialize()
        const cacheData = JSON.parse(cacheContent)

        // Extract refresh token from MSAL cache
        let refreshToken = ''
        const refreshTokens = cacheData.RefreshToken || {}
        const refreshTokenKey = Object.keys(refreshTokens)[0]
        if (refreshTokenKey) {
            refreshToken = refreshTokens[refreshTokenKey].secret || ''
        }

        const encryptedRefreshToken = refreshToken ? encrypt(refreshToken) : null

        // Save to system_integrations
        const supabase = await createClient()

        const payload: Record<string, any> = {
            provider: 'microsoft_global',
            access_token: encryptedAccessToken,
            expires_at: tokenResponse.expiresOn?.toISOString(),
            metadata: {
                email: accountEmail,
                account_id: tokenResponse.account?.homeAccountId,
                tenant_id: tokenResponse.tenantId,
                scopes: tokenResponse.scopes,
            },
            updated_at: new Date().toISOString(),
        }

        if (encryptedRefreshToken) {
            payload.refresh_token = encryptedRefreshToken
        }

        // Upsert - insert or update if microsoft_global already exists
        const { error: dbError } = await supabase
            .from('system_integrations')
            .upsert(payload, { onConflict: 'provider' })

        if (dbError) {
            console.error('[Microsoft OAuth] DB Error:', dbError)
            return NextResponse.redirect(
                `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/communications?error=${encodeURIComponent('Error al guardar la integración')}`
            )
        }

        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/communications?success=microsoft_connected`
        )
    } catch (e: any) {
        console.error('[Microsoft OAuth] Error:', e)
        return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/communications?error=${encodeURIComponent(e.message || 'Authentication failed')}`
        )
    }
}
