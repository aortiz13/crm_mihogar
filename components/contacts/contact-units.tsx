'use client'

import { UnitContact } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Home, Building, Calendar, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ContactUnitsProps {
    relations: UnitContact[]
}

const ROLE_LABELS: Record<string, string> = {
    'OWNER': 'Propietario',
    'TENANT': 'Arrendatario',
    'RESIDENT': 'Residente',
    'BROKER': 'Corredor',
    'ADMIN': 'Administrador'
}

export function ContactUnits({ relations }: ContactUnitsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Propiedades Asociadas</CardTitle>
                <CardDescription>Unidades vinculadas a este contacto y su rol en cada una.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Propiedad</TableHead>
                            <TableHead>Comunidad</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {relations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    Este contacto no tiene propiedades vinculadas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            relations.map((rel) => (
                                <TableRow key={rel.id} className={!rel.is_active ? 'opacity-50' : ''}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Home className="h-4 w-4 text-muted-foreground" />
                                            Unidad {rel.unit?.unit_number}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs">
                                            <Building className="h-3 w-3 text-muted-foreground" />
                                            {rel.unit?.communities?.name || `Comunidad #${rel.unit?.community_id}`}
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
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/dashboard/communities/${rel.unit?.community_id}/units/${rel.unit?.id}`}>
                                                Ver Unidad
                                            </Link>
                                        </Button>
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
