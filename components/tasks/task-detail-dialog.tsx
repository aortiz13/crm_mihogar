'use client'

import { Task } from '@/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, User, AlignLeft, Building, Link as LinkIcon, UserCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface TaskDetailDialogProps {
    task: Task | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function TaskDetailDialog({ task, open, onOpenChange }: TaskDetailDialogProps) {
    if (!task) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="flex h-full">
                    {/* Left Sidebar - Meta Info */}
                    <div className="w-1/3 bg-muted/30 border-r p-6 space-y-6 overflow-y-auto">

                        {/* Status & Priority */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Badge variant={task.status === 'done' ? 'default' : 'secondary'}>
                                    {task.status === 'done' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                </Badge>
                                <Badge variant="outline" className={
                                    task.priority === 'urgent' ? 'text-red-500 border-red-200 bg-red-50' :
                                        task.priority === 'high' ? 'text-orange-500 border-orange-200 bg-orange-50' :
                                            'text-blue-500 border-blue-200 bg-blue-50'
                                }>
                                    {task.priority.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        {/* People */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                <UserCircle className="w-4 h-4" /> Personas
                            </h4>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Responsable</p>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="w-6 h-6">
                                            <AvatarFallback>{task.assignee?.full_name?.substring(0, 2) || 'NA'}</AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm font-medium">{task.assignee?.full_name || 'Sin asignar'}</span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Creado por</p>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">{task.creator?.full_name || 'Sistema'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Relations */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" /> Relaciones
                            </h4>

                            {task.contact ? (
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Contacto</p>
                                    <Link
                                        href={`/dashboard/contactos/${task.contact.id}`}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors group"
                                    >
                                        <Avatar className="w-8 h-8">
                                            <AvatarFallback>{task.contact.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-blue-600 group-hover:underline">
                                                {task.contact.full_name}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">Ver perfil</span>
                                        </div>
                                    </Link>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Sin contacto asociado</p>
                            )}
                        </div>

                        <Separator />

                        {/* Dates */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                                <Calendar className="w-4 h-4" /> Fechas
                            </h4>
                            <div className="grid grid-cols-1 gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Vencimiento:</span>
                                    <span>{task.due_date ? format(new Date(task.due_date), 'dd MMM yyyy', { locale: es }) : '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Creado:</span>
                                    <span>{format(new Date(task.created_at), 'dd MMM yyyy', { locale: es })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Details */}
                    <div className="w-2/3 p-6 flex flex-col bg-white">
                        <DialogHeader className="mb-6">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-2">
                                <span>TASK-{task.id.slice(0, 4)}</span>
                            </div>
                            <DialogTitle className="text-2xl font-bold">{task.title}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-6 flex-1 overflow-y-auto">
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <AlignLeft className="w-4 h-4" /> Descripción
                                </h3>
                                <div className="text-sm leading-relaxed text-gray-700 bg-gray-50 p-4 rounded-md border">
                                    {task.description || "Sin descripción."}
                                </div>
                            </div>

                            {/* Timeline Placeholder */}
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between border-b pb-2">
                                    <h3 className="text-sm font-semibold flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Actividad
                                    </h3>
                                    <div className="text-xs text-muted-foreground">
                                        Solo lectura por ahora
                                    </div>
                                </div>

                                <div className="pl-4 border-l-2 border-gray-100 space-y-6">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-0 w-3 h-3 rounded-full bg-gray-200 border-2 border-white"></div>
                                        <p className="text-sm text-gray-600">
                                            Tarea creada por <span className="font-medium text-gray-900">{task.creator?.full_name || 'Sistema'}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(task.created_at), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
