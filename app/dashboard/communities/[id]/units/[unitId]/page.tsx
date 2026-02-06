import { getUnit } from '@/lib/actions/units'
import { getCommunity } from '@/lib/actions/communities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Building, Home } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { UnitResidents } from '@/components/units/unit-residents'

export default async function UnitProfilePage({ params }: { params: Promise<{ id: string, unitId: string }> }) {
    const { id, unitId } = await params
    const [community, unitRes] = await Promise.all([
        getCommunity(id),
        getUnit(parseInt(unitId))
    ])

    const unit = unitRes.data

    if (!unit || !community) {
        notFound()
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/dashboard/communities/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building className="h-3 w-3" />
                        <span>{community.name}</span>
                        <span>/</span>
                        <Home className="h-3 w-3" />
                        <span>Unidad {unit.unit_number}</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Unidad {unit.unit_number}</h1>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2">
                    <UnitResidents unit={unit} communityId={id} />
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalles de Propiedad</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Comunidad:</span>
                                <span className="font-medium">{community.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">ID Interno:</span>
                                <span className="font-medium">#{unit.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Fecha Registro:</span>
                                <span className="font-medium">{new Date(unit.created_at).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
