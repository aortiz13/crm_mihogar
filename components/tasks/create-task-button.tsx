'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreateTaskSheet } from './create-task-sheet'
import { Contact } from '@/types'

interface CreateTaskButtonProps {
    contacts: Contact[]
}

export function CreateTaskButton({ contacts }: CreateTaskButtonProps) {
    const [open, setOpen] = useState(false)

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Tarea
            </Button>
            <CreateTaskSheet
                open={open}
                onOpenChange={setOpen}
                contacts={contacts}
            />
        </>
    )
}
