'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { createActivity } from '@/lib/actions/activities'
import { toast } from 'sonner'
import { Activity } from '@/types'

interface AddEventDialogProps {
    communityId: string
    contactId?: string
}

export function AddEventDialog({ communityId, contactId }: AddEventDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [type, setType] = useState<Activity['type']>('global_event')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const result = await createActivity({
            community_id: communityId,
            contact_id: contactId || null,
            type,
            title,
            description,
            metadata: {}
        })

        setLoading(false)

        if (result.error) {
            toast.error('Error al crear evento: ' + result.error)
        } else {
            toast.success('Evento registrado correctamente')
            setOpen(false)
            setTitle('')
            setDescription('')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Registrar Evento
                </Button>
            </DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Registrar Nuevo Evento</DialogTitle>
                        <DialogDescription>
                            Registra un hito o actividad importante para el historial.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Tipo de Evento</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="global_event">Evento Global (Corte, Emergencia)</SelectItem>
                                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                                    <SelectItem value="announcement">Anuncio / Asamblea</SelectItem>
                                    <SelectItem value="ai_log">Nota Técnica / IA</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="title">Título</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ej: Corte de agua programado"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Descripción</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Detalles adicionales..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Evento'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
