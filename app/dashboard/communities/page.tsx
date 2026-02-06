import { getCommunities, createCommunity } from '@/lib/actions/communities'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateCommunityDialog } from '@/components/communities/create-community-dialog'
import { ImportCommunitiesDialog } from '@/components/communities/import-communities-dialog'
import { Building, MapPin, Users } from 'lucide-react'

export default async function CommunitiesPage() {
    const communities = await getCommunities()

    return (
        <div className="container mx-auto py-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Comunidades</h1>
                    <p className="text-muted-foreground">Gestione los edificios y propiedades.</p>
                </div>
                <div className="flex gap-2">
                    <ImportCommunitiesDialog />
                    <CreateCommunityDialog />
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {communities.map((community) => (
                    <Card key={community.id} className="hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium flex-grow">
                                <Link href={`/dashboard/communities/${community.id}`} className="hover:underline">
                                    {community.name}
                                </Link>
                            </CardTitle>
                            <Building className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2 mt-2">
                                {community.address && (
                                    <div className="text-xs text-muted-foreground flex items-center">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {community.address}
                                    </div>
                                )}
                                {community.unit_count && (
                                    <div className="text-2xl font-bold flex items-center">
                                        {community.unit_count}
                                        <span className="text-xs font-normal text-muted-foreground ml-1">unidades</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {communities.length === 0 && (
                    <div className="col-span-full text-center py-10 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                        No hay comunidades registradas aún.
                    </div>
                )}
            </div>
        </div>
    )
}
