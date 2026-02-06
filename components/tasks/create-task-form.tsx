'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
    Calendar as CalendarIcon,
    Home,
    Paperclip,
    ArrowUpRight,
    UserCircle,
    Clock,
    Loader2,
    X,
    Building2,
    DoorClosed
} from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Contact, Community, Unit } from '@/types'
import { createTask } from '@/lib/actions/tasks'
import { getUnits } from '@/lib/actions/units'

interface CreateTaskFormProps {
    contacts: Contact[]
    communities: Community[]
    onCancel: () => void
    onCreate?: () => void
    className?: string
}

export function CreateTaskForm({ contacts, communities, onCancel, onCreate, className }: CreateTaskFormProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<'todo' | 'in_progress' | 'done'>('todo')
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
    const [date, setDate] = useState<string>('')
    const [selectedContactId, setSelectedContactId] = useState<string>('none')
    const [selectedCommunityId, setSelectedCommunityId] = useState<string>('none')
    const [selectedUnitId, setSelectedUnitId] = useState<string>('none')
    const [units, setUnits] = useState<Unit[]>([])
    const [isLoadingUnits, setIsLoadingUnits] = useState(false)

    useEffect(() => {
        const fetchUnits = async () => {
            if (selectedCommunityId && selectedCommunityId !== 'none') {
                setIsLoadingUnits(true)
                const result = await getUnits(selectedCommunityId)
                if (result.data) {
                    setUnits(result.data)
                }
                setIsLoadingUnits(false)
            } else {
                setUnits([])
            }
            setSelectedUnitId('none')
        }

        fetchUnits()
    }, [selectedCommunityId])


    const handleSubmit = async () => {
        if (!title.trim()) {
            alert("El título es obligatorio")
            return
        }

        setIsLoading(true)
        const formData = new FormData()
        formData.append('title', title)
        formData.append('description', description)
        formData.append('status', status)
        formData.append('priority', priority)
        if (date) formData.append('due_date', new Date(date).toISOString())
        if (selectedContactId && selectedContactId !== 'none') formData.append('contact_id', selectedContactId)
        if (selectedCommunityId && selectedCommunityId !== 'none') formData.append('community_id', selectedCommunityId)
        if (selectedUnitId && selectedUnitId !== 'none') formData.append('unit_id', selectedUnitId)

        const result = await createTask(formData)
        setIsLoading(false)

        if (result?.error) {
            alert(`Error: ${result.error}`)
        } else {
            resetForm()
            if (onCreate) onCreate()
        }
    }

    const resetForm = () => {
        setTitle('')
        setDescription('')
        setStatus('todo')
        setPriority('medium')
        setDate('')
        setSelectedContactId('none')
        setSelectedCommunityId('none')
        setSelectedUnitId('none')
    }

    return (
        <div className={cn("flex flex-col h-full bg-background overflow-hidden", className)}>
            {/* Header Section */}
            <div className="px-6 pt-6 pb-2 space-y-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm dark:bg-emerald-950 dark:text-emerald-400">
                            {title ? title[0].toUpperCase() : <span className="opacity-50">#</span>}
                        </div>
                        <div className="flex flex-col flex-1">
                            <Input
                                placeholder="Sin nombre"
                                className="text-xl font-bold tracking-tight border-none shadow-none p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                            <span className="text-xs text-muted-foreground mt-1 font-medium">
                                En borrador
                            </span>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="inicio" className="flex flex-col flex-1 overflow-hidden w-full">
                <div className="px-6 shrink-0">
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
                </div>

                <div className="flex-1 overflow-y-auto min-h-0">
                    <TabsContent value="inicio" className="m-0 py-6 space-y-6">
                        {/* Metadata List */}
                        <div className="space-y-4 px-6">
                            {/* Relaciones / Contact */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span>Relaciones</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                                        <SelectTrigger className="h-8 w-fit min-w-[140px] text-xs">
                                            <SelectValue placeholder="Seleccionar contacto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin contacto</SelectItem>
                                            {contacts.map((contact) => (
                                                <SelectItem key={contact.id} value={contact.id}>
                                                    {contact.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Community */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                    <Building2 className="w-4 h-4" />
                                    <span>Condominio</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={selectedCommunityId} onValueChange={setSelectedCommunityId}>
                                        <SelectTrigger className="h-8 w-fit min-w-[140px] text-xs">
                                            <SelectValue placeholder="Seleccionar condominio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sin condominio</SelectItem>
                                            {communities.map((community) => (
                                                <SelectItem key={community.id} value={community.id}>
                                                    {community.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Unit */}
                            {selectedCommunityId !== 'none' && (
                                <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                        <DoorClosed className="w-4 h-4" />
                                        <span>Unidad</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={selectedUnitId}
                                            onValueChange={setSelectedUnitId}
                                            disabled={isLoadingUnits}
                                        >
                                            <SelectTrigger className="h-8 w-fit min-w-[140px] text-xs">
                                                <SelectValue placeholder={isLoadingUnits ? "Cargando..." : "Seleccionar unidad"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Sin unidad</SelectItem>
                                                {units.map((unit) => (
                                                    <SelectItem key={unit.id} value={unit.id.toString()}>
                                                        {unit.unit_number}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}


                            {/* Creado Por (Static for now) */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                    <UserCircle className="w-4 h-4" />
                                    <span>Creado Por</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 py-0.5 text-sm">
                                        <div className="bg-muted text-muted-foreground border w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold">
                                            YO
                                        </div>
                                        <span className="font-medium text-foreground">
                                            Moi
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Fecha / Due Date */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>Fecha Límite</span>
                                </div>
                                <div>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                        className="h-8 w-full text-xs"
                                    />
                                </div>
                            </div>

                            {/* Status */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                    <Clock className="w-4 h-4" />
                                    <span>Estado</span>
                                </div>
                                <div>
                                    <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                        <SelectTrigger className="h-8 w-fit text-xs border-none shadow-none p-0 bg-transparent hover:bg-muted/50 px-2 rounded-md transition-colors">
                                            <Badge variant="secondary" className={cn(
                                                "px-2.5 py-0.5 font-medium rounded-full text-[11px] uppercase tracking-wider mr-2",
                                                status === 'done' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" :
                                                    status === 'in_progress' ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                                                        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                            )}>
                                                {status === 'done' ? 'Resuelto' : status === 'in_progress' ? 'En Progreso' : 'Pendiente'}
                                            </Badge>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="todo">Pendiente</SelectItem>
                                            <SelectItem value="in_progress">En Progreso</SelectItem>
                                            <SelectItem value="done">Resuelto</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Priority */}
                            <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                                    <div className="w-4 flex justify-center text-xs font-bold text-muted-foreground">!</div>
                                    <span>Prioridad</span>
                                </div>
                                <div>
                                    <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                                        <SelectTrigger className="h-8 w-[140px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Baja</SelectItem>
                                            <SelectItem value="medium">Media</SelectItem>
                                            <SelectItem value="high">Alta</SelectItem>
                                            <SelectItem value="urgent">Urgente</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <Separator className="" />

                        {/* Assigned / Description Section */}
                        <div className="space-y-4 px-6 md:px-0">
                            <div className="flex items-center justify-between px-6">
                                <h3 className="text-sm font-semibold text-foreground tracking-tight">Descripción</h3>
                            </div>

                            <div className="p-0 px-6">
                                <Textarea
                                    placeholder="Añadir descripción..."
                                    className="min-h-[150px] resize-none bg-muted/30 border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="files" className="m-0 py-6 px-6 md:px-0">
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20 mx-6">
                            <Paperclip className="w-10 h-10 mb-3 opacity-20" />
                            <p className="text-sm font-medium text-foreground/70">No hay archivos adjuntos</p>
                            <p className="text-xs opacity-60 font-medium">Arrastra archivos aquí para subirlos</p>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>

            {/* Footer Actions */}
            <div className="mt-auto border-t p-4 flex items-center justify-end gap-3 bg-muted/20 shrink-0">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Tarea
                </Button>
            </div>
        </div>
    )
}
