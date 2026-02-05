
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function inviteAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!supabaseServiceKey) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
        return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const email = 'comprasinternetadrian@gmail.com'

    console.log(`Inviting ${email} as admin...`)

    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { role: 'admin', full_name: 'Adrian Admin' }
    })

    if (error) {
        console.error('Error inviting user:', error)
        return
    }

    console.log('User invited successfully:', data.user.id)

    // Double check profile update
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', data.user.id)

    if (profileError) {
        console.error('Error updating profile role:', profileError)
    } else {
        console.log('Profile role confirmed as admin.')
    }
}

inviteAdmin()
