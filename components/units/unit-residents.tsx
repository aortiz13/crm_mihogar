'use client'

import { Unit, UnitContact } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Trash2, Mail, Phone, Calendar, CheckCircle2 } from 'lucide-react'
import { AssignContactModal } from './assign-contact-modal'
import { unlinkContactFromUnit } from '@/lib/actions/units'
import { toast } from 'sonner'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UnitResidentsProps {
    unit: Unit
    communityId: string
}

const ROLE_LABELS: Record<string, string> = {
    'OWNER': 'Propietario',
    'TENANT': 'Arrendatario',
    'RESIDENT': 'Residente',
    'BROKER': 'Corredor',
    'ADMIN': 'Administrador'
}

export function UnitResidents({ unit, communityId }: UnitResidentsProps) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const contacts = unit.contact_relations || []

    const handleUnlink = async (contactId: string) => {
        setLoading(contactId)
        const res = await unlinkContactFromUnit(unit.id, contactId)
        setLoading(null)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Relación finalizada')
            router.refresh()
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Residentes y Responsables</CardTitle>
                    <CardDescription>Personas vinculadas a esta propiedad y sus roles.</CardDescription>
                </div>
                <AssignContactModal unitId={unit.id} communityId={communityId} />
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Desde</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {contacts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No hay contactos vinculados a esta unidad.
                                </TableCell>
                            </TableRow>
                        ) : (
                            contacts.map((rel) => (
                                <TableRow key={rel.id} className={!rel.is_active ? 'opacity-50' : ''}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{rel.contact?.full_name}</span>
                                            <div className="flex gap-2 mt-1">
                                                {rel.is_primary_payer && (
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-[10px] h-4">
                                                        Pagador Principal
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {ROLE_LABELS[rel.role] || rel.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {rel.is_active ? (
                                            <div className="flex items-center gap-1 text-green-600 text-xs">
                                                <CheckCircle2 className="h-3 w-3" /> Activo
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-muted-foreground text-xs">
                                                Histórico
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(rel.start_date).toLocaleDateString()}
                                            {rel.end_date && ` - ${new Date(rel.end_date).toLocaleDateString()}`}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {rel.is_active && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive"
                                                onClick={() => handleUnlink(rel.contact_id)}
                                                disabled={loading === rel.contact_id}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
