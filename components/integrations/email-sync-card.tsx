'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deleteSystemIntegration } from '@/lib/actions/integrations'
import { useRouter } from 'next/navigation'
import { Mail, Trash2, CheckCircle, Shield } from 'lucide-react'

interface MicrosoftSyncCardProps {
    integration: {
        id: string
        email: string
        provider: string
        created_at: string
    } | null
}

export function MicrosoftSyncCard({ integration }: MicrosoftSyncCardProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleConnect = () => {
        setIsLoading(true)
        window.location.href = '/api/integrations/microsoft/auth'
    }

    const handleDisconnect = async () => {
        if (!confirm('¿Estás seguro de desconectar la cuenta de Microsoft? Se dejará de sincronizar el correo.')) return

        setIsLoading(true)
        await deleteSystemIntegration()
        setIsLoading(false)
        router.refresh()
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <Shield className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Correo Microsoft 365</CardTitle>
                        <CardDescription>Buzón unificado correos@mi-hogar.cl para todas las comunidades.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {integration ? (
                    <div className="rounded-md border p-4 bg-muted/30 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-medium text-sm">Conectado como</p>
                                <p className="text-sm text-foreground font-semibold truncate">{integration.email}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                            Activo
                        </Badge>
                    </div>
                ) : (
                    <div className="rounded-md border border-dashed p-8 text-center bg-muted/10">
                        <div className="flex flex-col items-center gap-3">
                            <Mail className="h-10 w-10 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                Conecta la cuenta <strong>correos@mi-hogar.cl</strong> para sincronizar todos los correos de todas las comunidades.
                            </p>
                            <p className="text-xs text-muted-foreground">
                                La IA clasificará automáticamente cada correo a su comunidad correspondiente.
                            </p>
                            <Button onClick={handleConnect} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 mt-2">
                                {isLoading ? 'Conectando...' : 'Conectar Microsoft 365'}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
            {integration && (
                <CardFooter className="bg-muted/20 flex justify-between py-3">
                    <span className="text-xs text-muted-foreground">
                        La IA clasifica cada correo automáticamente por comunidad.
                    </span>
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDisconnect} disabled={isLoading}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Desconectar
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}
