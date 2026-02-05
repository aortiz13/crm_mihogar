'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteIntegration } from '@/lib/actions/integrations'
import { useRouter } from 'next/navigation'
import { Mail, RefreshCw, Trash2, CheckCircle } from 'lucide-react'

interface EmailSyncCardProps {
    communityId: string
    integration: {
        id: string
        email: string
        provider: string
        created_at: string
    } | null
}

export function EmailSyncCard({ communityId, integration }: EmailSyncCardProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleConnect = () => {
        setIsLoading(true)
        // Redirect to Auth Route
        window.location.href = `/api/integrations/google/auth?communityId=${communityId}`
    }

    const handleDisconnect = async () => {
        if (!confirm('¿Estás seguro de desconectar esta cuenta? Dejarás de sincronizar correos.')) return

        setIsLoading(true)
        await deleteIntegration(communityId, 'google')
        setIsLoading(false)
        router.refresh()
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Mail className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Sincronización de Correo</CardTitle>
                        <CardDescription>Conecta Gmail para recibir y enviar correos desde el CRM.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {integration ? (
                    <div className="rounded-md border p-4 bg-muted/30 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-sm">Conectado como</p>
                                <p className="text-sm text-foreground font-semibold truncate">{integration.email}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0">Activo</Badge>
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed p-8 text-center bg-muted/10">
                        <p className="text-sm text-muted-foreground mb-4">No hay cuenta conectada. Haz clic abajo para iniciar sesión con Google.</p>
                        <Button onClick={handleConnect} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                            {isLoading ? 'Conectando...' : 'Conectar Gmail'}
                        </Button>
                    </div>
                )}
            </CardContent>
            {integration && (
                <CardFooter className="bg-muted/20 flex justify-between py-3">
                    <span className="text-xs text-muted-foreground">Sincronización automática cada 5 min.</span>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDisconnect} disabled={isLoading}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desconectar
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}
