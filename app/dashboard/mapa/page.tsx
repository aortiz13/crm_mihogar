import { getCommunities } from '@/lib/actions/communities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CommunityMapClient } from '@/components/communities/community-map-client'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function MapaPage() {
    const communities = await getCommunities()

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Mapa de Clientes</h2>
                <div className="flex items-center space-x-2">
                    <Link href="/dashboard/communities">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nueva Comunidad
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Geolocalización de Comunidades</CardTitle>
                    <CardDescription>
                        Ubicación física de todas las comunidades administradas.
                        Solo aparecerán las comunidades con dirección validada.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CommunityMapClient communities={communities} />
                </CardContent>
            </Card>
        </div>
    )
}
