'use client'

import { Task } from '@/types'
import { Badge } from '@/components/ui/badge'
import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Calendar,
    Home,
    Paperclip,
    Pencil,
    ExternalLink,
    ArrowUpRight,
    UserCircle,
    Clock,
    X,
    Building2,
    DoorClosed
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface TaskDetailPanelProps {
    task: Task | null
    onClose: () => void
    className?: string
}

export function TaskDetailPanel({ task, onClose, className }: TaskDetailPanelProps) {
    if (!task) return null

    const createdAtDistance = formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: es })

    return (
        <div className={cn("flex flex-col h-full bg-background overflow-y-auto", className)}>
            {/* Header Section */}
            <div className="p-6 pb-2 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm dark:bg-emerald-950 dark:text-emerald-400">
                            {task.title[0].toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold tracking-tight">
                                {task.title}
                            </h2>
                            <span className="text-xs text-muted-foreground mt-1 font-medium">
                                Creado {createdAtDistance}
                            </span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <Tabs defaultValue="inicio" className="w-full">
                    <TabsList className="w-fit">
                        <TabsTrigger value="inicio" className="gap-2">
                            <Home className="w-3.5 h-3.5" />
                            Inicio
                        </TabsTrigger>
                        <TabsTrigger value="files" className="gap-2">
                            <Paperclip className="w-3.5 h-3.5" />
                            Archivos
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1">
                        <TabsContent value="inicio" className="m-0 py-6 space-y-6">
                            {/* Metadata List */}
                            <div className="space-y-4 px-6 md:px-0">
                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <ArrowUpRight className="w-4 h-4" />
                                        <span>Relaciones</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {task.contact ? (
                                            <Badge variant="outline" className="bg-muted/50 text-foreground border-border hover:bg-muted px-2 py-0.5 rounded-md flex items-center gap-1.5 font-normal">
                                                <span className="bg-primary text-primary-foreground w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold">
                                                    {task.contact.full_name[0]}
                                                </span>
                                                {task.contact.full_name}
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic font-normal text-muted-foreground/60">Sin relaciones</span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <Building2 className="w-4 h-4" />
                                        <span>Condominio</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {task.community ? (
                                            <Badge variant="outline" className="bg-muted/50 text-foreground border-border hover:bg-muted px-2 py-0.5 rounded-md flex items-center gap-1.5 font-normal">
                                                {task.community.name}
                                            </Badge>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic font-normal text-muted-foreground/60">Sin condominio</span>
                                        )}
                                    </div>
                                </div>

                                {task.unit && (
                                    <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                            <DoorClosed className="w-4 h-4" />
                                            <span>Unidad</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-muted/50 text-foreground border-border hover:bg-muted px-2 py-0.5 rounded-md flex items-center gap-1.5 font-normal">
                                                {task.unit.unit_number}
                                            </Badge>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <UserCircle className="w-4 h-4" />
                                        <span>Creado Por</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 py-0.5 text-sm">
                                            <div className="bg-muted text-muted-foreground border w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold">
                                                API
                                            </div>
                                            <span className="font-medium text-foreground">
                                                {task.creator?.full_name || 'agente virtual'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <Calendar className="w-4 h-4" />
                                        <span>Fecha</span>
                                    </div>
                                    <div className="text-sm text-foreground font-medium">
                                        {format(new Date(task.created_at), "d MMM, yyyy h:mm a", { locale: es })}
                                    </div>
                                </div>

                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <Clock className="w-4 h-4" />
                                        <span>Estado</span>
                                    </div>
                                    <div>
                                        <Badge variant="secondary" className={cn(
                                            "px-2.5 py-0.5 font-medium rounded-full text-[11px] uppercase tracking-wider",
                                            task.status === 'done' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                                                task.status === 'in_progress' ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                                                    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                        )}>
                                            {task.status === 'done' ? 'Resuelto' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <Separator className="mx-6 md:mx-0" />

                            {/* Assigned / Description Section */}
                            <div className="space-y-4 px-6 md:px-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold text-foreground tracking-tight">Asignado</h3>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
                                        <Pencil className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                <div className="bg-muted/30 p-4 rounded-lg border border-border/50 transition-colors hover:bg-muted/40">
                                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                                        {task.description || "Sin descripción asignada."}
                                    </p>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="files" className="m-0 py-6 px-6 md:px-0">
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                                <Paperclip className="w-10 h-10 mb-3 opacity-20" />
                                <p className="text-sm font-medium text-foreground/70">No hay archivos adjuntos</p>
                                <p className="text-xs opacity-60 font-medium">Arrastra archivos aquí para subirlos</p>
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </div>

            {/* Footer Actions */}
            <div className="mt-auto border-t p-4 flex items-center justify-end gap-3 bg-muted/20">
                <Button variant="outline" size="sm" className="gap-2 font-medium">
                    Opciones <kbd className="hidden sm:inline-flex h-4 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground uppercase">⌘ O</kbd>
                </Button>
                <Button size="sm" className="gap-2 font-medium">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir <kbd className="hidden sm:inline-flex h-4 items-center gap-1 rounded border bg-primary-foreground/10 px-1.5 font-mono text-[10px] font-medium text-primary-foreground/60 uppercase">⌘ ↵</kbd>
                </Button>
            </div>
        </div>
    )
}
