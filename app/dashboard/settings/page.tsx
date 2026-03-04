import { getSystemIntegration } from '@/lib/actions/integrations'
import { MicrosoftSyncCard } from '@/components/integrations/email-sync-card'
import { Separator } from '@/components/ui/separator'
import { Shield } from 'lucide-react'

export default async function SettingsPage() {
    const integration = await getSystemIntegration()

    return (
        <div className="container mx-auto py-8 max-w-4xl space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Configuración del CRM</h1>
                <p className="text-muted-foreground">
                    Administra los parámetros globales y las integraciones del sistema.
                </p>
            </div>

            <Separator />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" />
                        Integraciones de Comunicación
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Configura la conexión principal con Microsoft 365 para unificar la comunicación de todas las comunidades.
                    </p>
                    <div className="max-w-2xl">
                        <MicrosoftSyncCard integration={integration} />
                    </div>
                </div>

                <Separator />

                <div className="opacity-50 pointer-events-none">
                    <h2 className="text-xl font-semibold mb-4">Otros Parámetros</h2>
                    <p className="text-sm text-muted-foreground">
                        Funcionalidad próximamente disponible: gestión de plantillas globales, configuración de IA avanzada y respaldos.
                    </p>
                </div>
            </div>
        </div>
    )
}
