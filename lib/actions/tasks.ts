'use server'

import { createClient } from '@/lib/supabase/server'
import { Task } from '@/types'
import { revalidatePath } from 'next/cache'
import { createActivity } from './activities'

export async function getTasks(): Promise<Task[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('tasks')
        .select(`
            *,
            contact:contacts(id, full_name),
            assignee:profiles!assigned_to(id, full_name, email),
            creator:profiles!created_by(id, full_name, email)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching tasks:', error.message, error.details, error.hint)
        return []
    }

    return data as Task[]
}

export async function updateTaskStatus(taskId: string, newStatus: Task['status']) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId)

    if (error) {
        return { error: error.message }
    }

    if (newStatus === 'done') {
        const { data: task } = await supabase.from('tasks').select('title, community_id, contact_id').eq('id', taskId).single()
        if (task && task.community_id) {
            await createActivity({
                type: 'task_completed',
                community_id: task.community_id,
                contact_id: task.contact_id,
                title: 'Tarea Completada',
                description: `Se completó la tarea: ${task.title}`,
                metadata: { task_id: taskId }
            })
        }
    }

    revalidatePath('/dashboard/tasks')
    return { success: true }
}

export async function createTask(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as Task['status'] || 'todo'
    const priority = formData.get('priority') as Task['priority'] || 'medium'
    const due_date = formData.get('due_date') as string
    const community_id = formData.get('community_id') as string
    const contact_id = formData.get('contact_id') as string

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'User not authenticated' }
    }

    // Get profile id from user id (assuming profile.id === user.id or 1:1)
    const created_by = user.id

    const { error } = await supabase.from('tasks').insert({
        title,
        description,
        status,
        priority,
        due_date: due_date || null,
        community_id: community_id || null,
        contact_id: contact_id || null,
        created_by: created_by
    })

    if (error) {
        return { error: error.message }
    }

    if (community_id) {
        await createActivity({
            type: 'task_created',
            community_id: community_id as string,
            contact_id: contact_id as string || null,
            title: 'Tarea Creada',
            description: `Nueva tarea: ${title}`,
            metadata: { priority, due_date }
        })
    }

    revalidatePath('/dashboard/tasks')
    return { success: true }
}
