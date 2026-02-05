import { getCommunityIntegration } from '@/lib/actions/integrations'
import { EmailSettingsForm } from '@/components/communities/email-settings-form'
import { DeleteCommunityDialog } from '@/components/communities/delete-community-dialog'
import { getCommunity } from '@/lib/actions/communities'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ success?: string }>
}

export default async function CommunitySettingsPage(props: PageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const community = await getCommunity(params.id)

    if (!community) return notFound()

    const integration = await getCommunityIntegration(params.id, 'google')

    return (
        <div className="flex flex-col space-y-6 p-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/communities">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Configuración: {community.name}</h2>
                    <p className="text-muted-foreground">Gestiona las integraciones y ajustes de esta comunidad.</p>
                </div>
            </div>

            {searchParams.success === 'true' && (
                <div className="p-4 bg-green-50 text-green-700 rounded-md border border-green-200">
                    ¡Cuenta conectada exitosamente!
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                <EmailSettingsForm community={community} integration={integration} />
            </div>

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
    )
}
