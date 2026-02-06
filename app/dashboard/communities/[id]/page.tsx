import { getCommunity } from '@/lib/actions/communities'
import { getCommunityDocuments } from '@/lib/actions/documents'
import { getCommunityActivities } from '@/lib/actions/activities'
import { CommunityInfo } from '@/components/communities/community-info'
import { CommunityDocuments } from '@/components/communities/community-documents'
import { CommunityChat } from '@/components/communities/community-chat'
import { Storyline } from '@/components/activities/storyline'
import { AddEventDialog } from '@/components/activities/add-event-dialog'
import { EmailSettingsForm } from '@/components/communities/email-settings-form'
import { DeleteCommunityDialog } from '@/components/communities/delete-community-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [community, documents, activities] = await Promise.all([
        getCommunity(id),
        getCommunityDocuments(id),
        getCommunityActivities(id)
    ])

    if (!community) {
        notFound()
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/communities">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{community.name}</h1>
                    <p className="text-muted-foreground">{community.address}</p>
                </div>
            </div>

            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Información</TabsTrigger>
                    <TabsTrigger value="storyline">Storyline</TabsTrigger>
                    <TabsTrigger value="documents">Base de Conocimiento</TabsTrigger>
                    <TabsTrigger value="chat">Chat con IA</TabsTrigger>
                    <TabsTrigger value="settings">Configuración</TabsTrigger>
                </TabsList>
                <TabsContent value="info">
                    <CommunityInfo community={community} />
                </TabsContent>
                <TabsContent value="storyline" className="space-y-4">
                    <div className="flex justify-end">
                        <AddEventDialog communityId={community.id} />
                    </div>
                    <Storyline activities={activities} title="Actividades de la Comunidad" />
                </TabsContent>
                <TabsContent value="documents">
                    <CommunityDocuments documents={documents} communityId={community.id} />
                </TabsContent>
                <TabsContent value="chat">
                    <CommunityChat communityId={community.id} />
                </TabsContent>
                <TabsContent value="settings">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-medium">Configuración de Integraciones</h3>
                            <p className="text-sm text-muted-foreground">Configura el correo electrónico y otros servicios para esta comunidad.</p>
                        </div>
                        <EmailSettingsForm community={community} />

                        <div className="border border-destructive/20 bg-destructive/5 rounded-lg p-6 space-y-4 mt-8">
                            <h3 className="text-lg font-semibold text-destructive">Zona de Peligro</h3>
                            <p className="text-sm text-muted-foreground">
                                Aquí puedes realizar acciones destructivas como eliminar la comunidad. Ten cuidado, estas acciones no son reversibles.
                            </p>

                            <div className="flex justify-start">
                                <DeleteCommunityDialog communityId={community.id} communityName={community.name}>
                                    <Button variant="destructive">
                                        Eliminar Comunidad
                                    </Button>
                                </DeleteCommunityDialog>
                            </div>
                        </div>
                    </div>
                </TabsContent>

            </Tabs>
        </div>
    )
}
