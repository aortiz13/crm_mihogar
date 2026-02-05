import { NextRequest, NextResponse } from 'next/server'
import { syncEmailsForCommunity } from '@/lib/services/gmail'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
    const communityId = '2972a3a6-75e0-43fa-b2b2-efb1b9c08529' // Hardcoded from Step 1143
    console.log(`Debug Syncing for ${communityId}`)

    try {
        const result = await syncEmailsForCommunity(communityId)
        return NextResponse.json({
            status: 'done',
            communityId,
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
