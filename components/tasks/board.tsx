'use client'



import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Task } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateTaskStatus } from '@/lib/actions/tasks'
import { cn } from '@/lib/utils'
import { Calendar, User } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface BoardProps {
    initialTasks: Task[]
    onTaskClick: (task: Task) => void
}

const COLUMNS = {
    todo: 'Pendiente',
    in_progress: 'En Progreso',
    done: 'Resuelto',
} as const

type Status = keyof typeof COLUMNS

export function Board({ initialTasks, onTaskClick }: BoardProps) {
    const [tasks, setTasks] = React.useState<Task[]>(initialTasks)

    // Update local state when props change (revalidatePath)
    React.useEffect(() => {
        setTasks(initialTasks)
    }, [initialTasks])

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result

        if (!destination) return

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return
        }

        const newStatus = destination.droppableId as Status
        const taskId = draggableId

        // Optimistic Update
        const updatedTasks = tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        )
        setTasks(updatedTasks)

        // Server Action
        await updateTaskStatus(taskId, newStatus)
    }

    const getTasksByStatus = (status: Status) => {
        return tasks.filter((task) => task.status === status)
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {(Object.keys(COLUMNS) as Status[]).map((columnId) => (
                    <div key={columnId} className="flex h-full min-w-[300px] flex-col rounded-lg bg-muted/50 p-4">
                        <h3 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {COLUMNS[columnId]} ({getTasksByStatus(columnId).length})
                        </h3>
                        <Droppable droppableId={columnId}>
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    className="flex flex-1 flex-col gap-3"
                                >
                                    {getTasksByStatus(columnId).map((task, index) => (
                                        <Draggable key={task.id} draggableId={task.id} index={index}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className={cn(
                                                        "mb-2",
                                                        snapshot.isDragging && "opacity-50"
                                                    )}
                                                >
                                                    <Card
                                                        onClick={() => onTaskClick(task)}
                                                        className="cursor-pointer hover:shadow-md transition-all border block group"
                                                    >
                                                        <CardHeader className="p-4 pb-2 space-y-0">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={cn(
                                                                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                                                                    task.priority === 'urgent' && "bg-red-100 text-red-700",
                                                                    task.priority === 'high' && "bg-orange-100 text-orange-700",
                                                                    task.priority === 'medium' && "bg-yellow-100 text-yellow-700",
                                                                    task.priority === 'low' && "bg-green-100 text-green-700",
                                                                )}>
                                                                    {task.priority === 'urgent' && 'Urgente'}
                                                                    {task.priority === 'high' && 'Alta'}
                                                                    {task.priority === 'medium' && 'Media'}
                                                                    {task.priority === 'low' && 'Baja'}
                                                                </span>
                                                                {task.assignee && (
                                                                    <Avatar className="w-6 h-6 border-2 border-white">
                                                                        <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                                                                            {task.assignee.full_name?.substring(0, 2)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                )}
                                                            </div>
                                                            <CardTitle className="text-sm font-semibold leading-tight group-hover:text-blue-600 transition-colors">
                                                                {task.title}
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="p-4 pt-2 space-y-3">
                                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                                {task.description}
                                                            </p>

                                                            <div className="flex items-center justify-between pt-2 border-t mt-2">
                                                                {task.contact ? (
                                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                                        <User className="w-3 h-3" />
                                                                        <span className="truncate max-w-[100px]">{task.contact.full_name}</span>
                                                                    </div>
                                                                ) : <span></span>}

                                                                {task.due_date && (
                                                                    <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                                                        <Calendar className="w-3 h-3" />
                                                                        <span>{new Date(task.due_date).toLocaleDateString()}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </div>
                ))}
            </div>
        </DragDropContext>
    )
}
