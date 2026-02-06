'use client'

import { useEffect, useState } from 'react'
import { Unit } from '@/types'
import { getUnits } from '@/lib/actions/units'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, User, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface UnitListProps {
    communityId: string
}

export function UnitList({ communityId }: UnitListProps) {
    const [units, setUnits] = useState<Unit[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const load = async () => {
            const res = await getUnits(communityId)
            if (res.data) setUnits(res.data)
            setLoading(false)
        }
        load()
    }, [communityId])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <Card>
            <CardHeader>
                <CardTitle>Unidades</CardTitle>
                <CardDescription>
                    Listado de departamentos, casas o locales de esta comunidad.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>N° Unidad</TableHead>
                            <TableHead>Residentes</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {units.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                    No hay unidades registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            units.map((unit) => (
                                <TableRow key={unit.id}>
                                    <TableCell className="font-medium">
                                        {unit.unit_number}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <User className="h-3 w-3" />
                                            {unit.resident_email || 'Sin contacto asignado'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/dashboard/communities/${communityId}/units/${unit.id}`}>
                                                Ver Ficha
                                                <ArrowRight className="ml-2 h-4 w-4" />
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
