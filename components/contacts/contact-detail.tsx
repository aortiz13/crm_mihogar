'use client'

import { useState } from 'react'
import { updateContact, addContactNote } from '@/lib/actions/contacts'
import { Contact, ContactNote } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Calendar, Mail, Phone, MapPin, Building, Save } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner' // Assuming sonner is used, or alert

interface ContactDetailProps {
    contact: Contact
    notes: ContactNote[]
    communities: { id: string, name: string }[]
}

export function ContactDetail({ contact, notes: initialNotes, communities }: ContactDetailProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [notes, setNotes] = useState(initialNotes)
    const [newNote, setNewNote] = useState('')

    // Form states
    const [formData, setFormData] = useState({
        full_name: contact.full_name,
        email: contact.email || '',
        phone: contact.phone || '',
        community_id: contact.community_id || '',
        unit_number: contact.unit_number || '',
    })

    const handleUpdate = async () => {
        setIsLoading(true)
        const res = await updateContact(contact.id, {
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            community_id: formData.community_id,
            unit_number: formData.unit_number,
        })

        if (res.error) {
            // toast.error('Error al actualizar')
            alert('Error al actualizar')
        } else {
            // toast.success('Contacto actualizado')
            alert('Contacto actualizado')
        }
        setIsLoading(false)
    }

    const handleAddNote = async () => {
        if (!newNote.trim()) return
        const res = await addContactNote(contact.id, newNote)
        if (res.error) {
            alert('Error al crear nota')
        } else {
            setNewNote('')
            // Optimistic update or router refresh handled by server action usually, 
            // but for instant feedback we might want to manually add if we returned the object.
            // For now relying on revalidatePath in action.
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Left Column: Profile (2 cols) */}
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src={contact.avatar_url || ''} />
                            <AvatarFallback className="text-xl">{contact.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <CardTitle className="text-2xl">{contact.full_name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                <Mail className="h-4 w-4" /> {contact.email || 'Sin email'}
                                <span className="text-muted-foreground mx-1">•</span>
                                <Phone className="h-4 w-4" /> {contact.phone || 'Sin teléfono'}
                            </CardDescription>
                            <div className="flex gap-2 mt-3">
                                <Badge variant="outline">Propietario</Badge>
                                <Badge variant="secondary">{contact.communities?.name || 'Sin Comunidad'}</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 py-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Teléfono</Label>
                                <Input
                                    id="phone"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">Ciudad / Ubicación</Label>
                                <Input id="city" placeholder="Santiago, Chile" />
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Building className="h-4 w-4" /> Asociación de Comunidad
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Comunidad</Label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={formData.community_id}
                                        onChange={(e) => setFormData({ ...formData, community_id: e.target.value })}
                                    >
                                        <option value="">Seleccionar...</option>
                                        {communities.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Unidad / Depto</Label>
                                    <Input
                                        value={formData.unit_number}
                                        onChange={(e) => setFormData({ ...formData, unit_number: e.target.value })}
                                        placeholder="Ej: 405, 12B"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="justify-end bg-muted/20 py-4">
                        <Button onClick={handleUpdate} disabled={isLoading}>
                            <Save className="mr-2 h-4 w-4" />
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            {/* Right Column: Sidebar (1 col) */}
            <div className="space-y-6">
                <Tabs defaultValue="history" className="w-full">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="history">Historial</TabsTrigger>
                        <TabsTrigger value="notes">Notas</TabsTrigger>
                    </TabsList>

                    <TabsContent value="history" className="mt-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium">Actividad Reciente</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="flex gap-3">
                                    <div className="mt-1 bg-blue-100 p-1 rounded-full h-fit">
                                        <Mail className="h-3 w-3 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Correo Recibido</p>
                                        <p className="text-muted-foreground text-xs">Asunto: "Consulta Gasto Común"</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Hace 2 horas</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex gap-3">
                                    <div className="mt-1 bg-green-100 p-1 rounded-full h-fit">
                                        <Save className="h-3 w-3 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Perfil Creado</p>
                                        <p className="text-muted-foreground text-xs">Importado desde sistema</p>
                                        <p className="text-[10px] text-muted-foreground mt-1">Hace 1 día</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-4 spaces-y-4">
                        <Card className="mb-4">
                            <CardContent className="p-4 space-y-3">
                                <Textarea
                                    placeholder="Escribe una nota interna..."
                                    className="min-h-[80px]"
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                />
                                <Button size="sm" className="w-full" onClick={handleAddNote}>Agregar Nota</Button>
                            </CardContent>
                        </Card>

                        <div className="space-y-3">
                            {notes.map(note => (
                                <Card key={note.id}>
                                    <CardContent className="p-3 text-sm">
                                        <p>{note.content}</p>
                                        <div className="flex justify-between items-center mt-2 text-[10px] text-muted-foreground">
                                            <span>Agente</span>
                                            <span>{format(new Date(note.created_at), "PP p", { locale: es })}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {notes.length === 0 && (
                                <p className="text-center text-xs text-muted-foreground py-4">No hay notas aún.</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
