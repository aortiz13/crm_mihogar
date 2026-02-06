'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

import { Contact, ContactNote } from '@/types'

// Removed local interface definitions


export async function getContacts() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('contacts')
        .select(`
      *,
      communities (
        name
      )
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching contacts:', error)
        return []
    }

    return data as Contact[]
}

export async function getContact(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('contacts')
        .select(`
             *,
            communities (
                name
            )
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching contact:', error)
        return null
    }

    return data as Contact
}

export async function createContact(formData: FormData) {
    const supabase = await createClient()

    const full_name = formData.get('full_name') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const community_id = formData.get('community_id') as string
    const unit_number = formData.get('unit_number') as string

    // Basic validation
    if (!full_name) {
        return { error: 'Full name is required' }
    }

    const { data, error } = await supabase
        .from('contacts')
        .insert({
            full_name,
            email: email || null, // Handle empty strings as null for unique constraint if handled by DB, though nullable unique works in Postgres
            phone: phone || null,
            community_id: community_id || null,
            unit_number: unit_number || null,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating contact:', error)
        return { error: error.message }
    }

    // Auto-sync with pivot table if unit info provided
    if (community_id && unit_number) {
        const { data: unit } = await supabase
            .from('units')
            .upsert({ 
                community_id, 
                unit_number: unit_number.trim() 
            }, { onConflict: 'community_id, unit_number' })
            .select()
            .single()

        if (unit) {
            await supabase
                .from('unit_contacts')
                .upsert({
                    unit_id: unit.id,
                    contact_id: data.id,
                    role: 'RESIDENT',
                    is_active: true,
                    is_primary_payer: true,
                    start_date: new Date().toISOString().split('T')[0]
                }, { onConflict: 'unit_id, contact_id' })
        }
    }

    revalidatePath('/dashboard/contactos')
    return { success: true, data }
}

export async function updateContact(id: string, data: Partial<Contact>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id)

    if (error) {
        console.error('Error updating contact:', error)
        return { error: error.message }
    }

    // Sync pivot if unit/community changed
    if (data.community_id || data.unit_number) {
        const { data: fullContact } = await supabase.from('contacts').select('*').eq('id', id).single()
        if (fullContact?.community_id && fullContact?.unit_number) {
            const { data: unit } = await supabase
                .from('units')
                .upsert({ 
                    community_id: fullContact.community_id, 
                    unit_number: fullContact.unit_number.trim() 
                }, { onConflict: 'community_id, unit_number' })
                .select()
                .single()

            if (unit) {
                await supabase
                    .from('unit_contacts')
                    .upsert({
                        unit_id: unit.id,
                        contact_id: id,
                        role: 'RESIDENT',
                        is_active: true,
                        is_primary_payer: true,
                        start_date: new Date().toISOString().split('T')[0]
                    }, { onConflict: 'unit_id, contact_id' })
            }
        }
    }

    revalidatePath(`/dashboard/contacts/${id}`)
    revalidatePath('/dashboard/contactos')
    return { success: true }
}

export async function getContactNotes(contactId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('contact_notes')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching notes:', error)
        return []
    }

    return data as ContactNote[]
}

export async function addContactNote(contactId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('contact_notes')
        .insert({
            contact_id: contactId,
            author_id: user.id,
            content
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard/contacts/${contactId}`)
    return { success: true }
}
