'use client'

import React from 'react'
import { Board } from '@/components/tasks/board'
import { CreateTaskForm } from '@/components/tasks/create-task-form'
import { TaskDetailPanel } from '@/components/tasks/task-detail-panel'
import { Task, Contact, Community } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

interface TasksLayoutProps {
    initialTasks: Task[]
    contacts: Contact[]
    communities: Community[]
}

export function TasksLayout({ initialTasks, contacts, communities }: TasksLayoutProps) {
    const [isCreating, setIsCreating] = React.useState(false)
    const [selectedTask, setSelectedTask] = React.useState<Task | null>(null)

    const handleCreateClick = () => {
        // setSelectedTask(null) // Optional: decide if we want to close main detail view or not. User didn't specify. Keeping detail view open seems fine if it's a popup. 
        setIsCreating(true)
    }

    const handleTaskClick = (task: Task) => {
        // setIsCreating(false) // No longer mutually exclusive
        setSelectedTask(task)
    }

    const closeDetail = () => {
        setSelectedTask(null)
    }

    const closeCreate = () => {
        setIsCreating(false)
    }

    return (
        <div className="flex h-[calc(100vh-6rem)] flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tablero de Tareas</h1>
                    <p className="text-muted-foreground">Gestione las tareas y solicitudes.</p>
                </div>
                <Button onClick={handleCreateClick} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nueva Tarea
                </Button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Board Area */}
                <div className="flex-1 min-w-0 overflow-x-auto px-2 py-4">
                    <Board initialTasks={initialTasks} onTaskClick={handleTaskClick} />
                </div>

                {/* Right Panel - Static / Solid -> Only for Details now */}
                {selectedTask && (
                    <div className="w-[400px] sm:w-[500px] bg-background border-l overflow-y-auto shrink-0 transition-all duration-300">
                        <TaskDetailPanel
                            task={selectedTask}
                            onClose={closeDetail}
                            className="h-full border-none shadow-none"
                        />
                    </div>
                )}
            </div>

            {/* Create Task Popup */}
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="max-w-4xl p-0 h-[85vh] overflow-hidden flex flex-col gap-0 border-none sm:rounded-xl">
                    <CreateTaskForm
                        contacts={contacts}
                        communities={communities}
                        onCancel={closeCreate}
                        onCreate={() => {
                            closeCreate()
                            // Rely on server action revalidation
                        }}
                        className="h-full border-none shadow-none rounded-none"
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
