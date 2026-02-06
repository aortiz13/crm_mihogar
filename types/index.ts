export interface Community {
    id: string
    name: string
    address: string | null
    unit_count: number | null
    onedrive_folder_id: string | null
    contact_info: { email?: string; phone?: string } | null
    bank_data?: {
        bank_name?: string
        account_type?: string
        account_number?: string
        rut?: string
        email?: string
    } | null
    created_at: string
    email_provider?: 'gmail' | 'smtp' | null
    smtp_host?: string | null
    smtp_port?: number | null
    smtp_user?: string | null
    smtp_pass?: string | null
    gmail_access_token?: string | null
}

export interface Activity {
    id: string
    community_id: string
    contact_id: string | null
    type: 'email_in' | 'email_out' | 'task_created' | 'task_completed' | 'ai_log' | 'maintenance' | 'announcement' | 'global_event'
    title: string
    description: string | null
    metadata: Record<string, any>
    created_at: string
}

export interface CommunityDocument {
    id: string
    community_id: string
    filename: string
    file_url: string
    content_type: string
    status: 'processing' | 'indexed' | 'error'
    created_at: string
}

export interface Profile {
    id: string
    email: string
    full_name: string | null
    role: 'admin' | 'operator'
    assigned_communities: string[] | null
    created_at: string
}

export interface Task {
    id: string
    title: string
    description: string | null
    status: 'todo' | 'in_progress' | 'done'
    priority: 'low' | 'medium' | 'high' | 'urgent'
    due_date: string | null
    assigned_to: string | null
    communication_id: string | null
    community_id: string | null
    contact_id: string | null
    created_by: string | null
    created_at: string
    // Joined relations (optional for display)
    contact?: {
        id: string
        full_name: string
    }
    assignee?: {
        id: string
        full_name: string | null
        email: string
    }
    creator?: {
        id: string
        full_name: string | null
        email: string
    }
}

export interface Contact {
    id: string
    full_name: string
    email: string | null
    phone: string | null
    community_id: string | null
    unit_number: string | null
    avatar_url: string | null
    social_profiles: Record<string, string>
    custom_attributes: Record<string, any>
    created_at: string
    // relations
    communities?: {
        name: string
    }
}

export interface ContactNote {
    id: string
    contact_id: string
    author_id: string
    content: string
    created_at: string
}
