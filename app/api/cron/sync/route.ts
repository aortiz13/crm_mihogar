import { NextRequest, NextResponse } from 'next/server'
import { syncEmails } from '@/lib/services/microsoft-graph'

export async function GET(req: NextRequest) {
    // Basic security: Check for a Cron Secret Header
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const result = await syncEmails()

        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            total: result.total,
            new: result.new,
            message: `Synced ${result.new} new emails from unified mailbox`,
        })
    } catch (error: any) {
        console.error('[Cron Sync] Error:', error)
        return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 })
    }
}
