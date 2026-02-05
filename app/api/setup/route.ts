import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    // Raw SQL for creating table
    // Note: supabase-js client via `rpc` or direct query isn't standard for DDL unless access level high.
    // Actually, standard `supabase-js` client DOES NOT support sending raw SQL strings directly unless there is a Postgres function for it.

    // Since I don't have a way to run raw SQL via the client easily without a stored procedure (catch-22),
    // I must rely on the User to run the SQL in their Supabase Dashboard SQL Editor.

    // Checking if table exists with a cheap query
    const { error } = await supabase.from('community_integrations').select('id').limit(1)

    if (error) {
        return NextResponse.json({
            status: 'error',
            message: 'Table likely missing or no permissions.',
            details: error.message
        })
    }

    return NextResponse.json({ status: 'ok', message: 'Table exists' })
}
