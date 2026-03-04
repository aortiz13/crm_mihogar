import { NextRequest, NextResponse } from 'next/server'
import { syncEmails } from '@/lib/services/microsoft-graph'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    console.log('[Debug] Syncing Microsoft unified mailbox...')

    try {
        const result = await syncEmails()
        return NextResponse.json({
            status: 'done',
            result
        })
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack
        }, { status: 500 })
    }
}
