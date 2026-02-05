import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!url) {
        return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL is not defined' }, { status: 500 })
    }

    try {
        console.log(`Testing connectivity to: ${url}`)
        const startTime = Date.now()
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const res = await fetch(url, {
            method: 'GET',
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        return NextResponse.json({
            status: 'success',
            url,
            httpStatus: res.status,
            latency: `${Date.now() - startTime}ms`
        })
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            url,
            message: error.message,
            cause: error.cause ? String(error.cause) : 'unknown',
            stack: error.stack
        }, { status: 500 })
    }
}
