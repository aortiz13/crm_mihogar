'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Contact, Task, Profile } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, User, Calendar, CheckSquare, Loader2, Link as LinkIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { createContact, getContacts as getAllContacts } from '@/lib/actions/contacts'
import { createTask, getTasks } from '@/lib/actions/tasks'
import { getProfiles } from '@/lib/actions/profiles'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface CrmContextPanelProps {
    email: string
    name: string
    communityId: string
}

export function CrmContextPanel({ email, name, communityId }: CrmContextPanelProps) {
    const [contact, setContact] = useState<Contact | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [tasks, setTasks] = useState<Task[]>([])
    const [profiles, setProfiles] = useState<Profile[]>([])

    // New Task State
    const [newTaskTitle, setNewTaskTitle] = useState('')
    const [newTaskDue, setNewTaskDue] = useState('')
    const [newTaskStatus, setNewTaskStatus] = useState<Task['status']>('todo')
    const [newTaskAssignee, setNewTaskAssignee] = useState('')
    const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium')

    useEffect(() => {
        loadData()
    }, [email])

    const loadData = async () => {
        setIsLoading(true)
        try {
            // 1. Find contact by email (inefficient client-side filtering for now as per plan)
            const allContacts = await getAllContacts()
            const found = allContacts.find(c => c.email === email)
            setContact(found || null)

            // 2. Load tasks if contact found
            if (found) {
                const [allTasks, allProfiles] = await Promise.all([
                    getTasks(),
                    getProfiles()
                ])
                const relatedTasks = allTasks.filter(t => t.contact_id === found.id)
                setTasks(relatedTasks)
                setProfiles(allProfiles)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCreateContact = async () => {
        const formData = new FormData()
        formData.append('full_name', name)
        formData.append('email', email)
        formData.append('community_id', communityId)

        const res = await createContact(formData)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Contacto creado")
            setContact(res.data as unknown as Contact)
        }
    }

    const handleCreateTask = async () => {
        if (!contact) return
        if (!newTaskTitle) return

        const formData = new FormData()
        formData.append('title', newTaskTitle)
        formData.append('contact_id', contact.id)
        formData.append('community_id', communityId)
        formData.append('status', newTaskStatus)
        formData.append('priority', newTaskPriority)
        if (newTaskAssignee) formData.append('assigned_to', newTaskAssignee)
        if (newTaskDue) formData.append('due_date', newTaskDue)

        const res = await createTask(formData)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Tarea creada")
            setNewTaskTitle('')
            setNewTaskDue('')
            loadData() // Refresh tasks
        }
    }

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-6 w-6" /></div>
    }

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Contact Section */}
            <Card className="shadow-sm border-muted">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center justify-between uppercase tracking-wider text-muted-foreground">
                        Contacto
                        {!contact ? <Badge variant="destructive" className="text-[10px] h-4">No en CRM</Badge> : <Badge variant="secondary" className="text-[10px] h-4">Cliente</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                    {!contact ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border shadow-sm">
                                    <AvatarFallback className="bg-muted text-lg">{name ? name[0] : email[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold leading-none">{name || 'Sin nombre'}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{email}</p>
                                </div>
                            </div>
                            <Button onClick={handleCreateContact} className="w-full h-9 gap-2" size="sm">
                                <Plus className="h-4 w-4" /> Registrar en CRM
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border shadow-sm">
                                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{contact.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <p className="text-sm font-bold leading-none">{contact.full_name}</p>
                                    <p className="text-xs text-muted-foreground truncate max-w-[180px]">{contact.email}</p>
                                    {contact.phone && <p className="text-[10px] font-medium text-primary">{contact.phone}</p>}
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full h-8 text-xs font-medium bg-muted/20 hover:bg-muted/40" asChild>
                                <Link href={`/dashboard/contactos/${contact.id}`} target="_blank">
                                    <User className="mr-2 h-3 w-3" /> Ver Expediente Completo
                                </Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Tabs for Tasks / Notes */}
            {contact && (
                <Tabs defaultValue="tasks" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tasks">Tareas</TabsTrigger>
                        <TabsTrigger value="notes">Notas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tasks" className="flex-1 flex flex-col gap-3 min-h-0">
                        <div className="p-3 border rounded-md bg-muted/20 space-y-3">
                            <Input
                                placeholder="Nueva tarea..."
                                className="h-8 text-sm bg-background"
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Estado</p>
                                    <Select value={newTaskStatus} onValueChange={(v: any) => setNewTaskStatus(v)}>
                                        <SelectTrigger className="h-8 text-xs bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">Pendiente</SelectItem>
                                            <SelectItem value="in_progress">En Curso</SelectItem>
                                            <SelectItem value="done">Completada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Responsable</p>
                                    <Select value={newTaskAssignee} onValueChange={setNewTaskAssignee}>
                                        <SelectTrigger className="h-8 text-xs bg-background">
                                            <SelectValue placeholder="Sin asignar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="unassigned">Sin asignar</SelectItem>
                                            {profiles.map(p => (
                                                <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1 space-y-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Fecha Límite</p>
                                    <Input
                                        type="date"
                                        className="h-8 text-sm bg-background w-full"
                                        value={newTaskDue}
                                        onChange={e => setNewTaskDue(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col justify-end">
                                    <Button size="sm" className="h-8 w-10 p-0" onClick={handleCreateTask} disabled={!newTaskTitle}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 -mr-3 pr-3">
                            <div className="space-y-2 pb-2">
                                {tasks.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">No hay tareas pendientes.</p>
                                ) : (
                                    tasks.map(task => (
                                        <div key={task.id} className="flex items-start gap-2 p-2 border rounded-md bg-card text-sm">
                                            <CheckSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium line-clamp-1">{task.title}</p>
                                                {task.due_date && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Vence: {format(new Date(task.due_date), "dd MMM", { locale: es })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="notes">
                        <div className="flex items-center justify-center p-8 text-muted-foreground text-xs">
                            Próximamente: Notas rápidas
                        </div>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}
