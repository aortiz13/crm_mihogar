'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { updateCommunityEmailSettings } from '@/lib/actions/communities'
import { Community } from '@/types'
import { toast } from 'sonner'
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

interface EmailSettingsFormProps {
    community: Community
}

export function EmailSettingsForm({ community, integration }: { community: Community, integration?: any }) {
    const [isLoading, setIsLoading] = useState(false)
    const [provider, setProvider] = useState<string>(community.email_provider || 'gmail')

    // Form states
    const [smtpHost, setSmtpHost] = useState(community.smtp_host || '')
    const [smtpPort, setSmtpPort] = useState(community.smtp_port?.toString() || '')
    const [smtpUser, setSmtpUser] = useState(community.smtp_user || '')
    const [smtpPass, setSmtpPass] = useState(community.smtp_pass || '')

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const settings = {
                email_provider: provider,
                smtp_host: provider === 'smtp' ? smtpHost : null,
                smtp_port: provider === 'smtp' ? smtpPort : null,
                smtp_user: provider === 'smtp' ? smtpUser : null,
                smtp_pass: provider === 'smtp' ? smtpPass : null,
                // Gmail token is now handled via OAuth backend flow
                gmail_access_token: null,
            }

            const result = await updateCommunityEmailSettings(community.id, settings)
            if (result.error) {
                toast.error('Error al guardar configuración', { description: result.error })
            } else {
                toast.success('Configuración guardada exitosamente')
            }
        } catch (error) {
            toast.error('Error inesperado')
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleConnect = () => {
        window.location.href = `/api/integrations/google/auth?communityId=${community.id}`
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Configuración de Correo
                </CardTitle>
                <CardDescription>
                    Selecciona el método de envío y recepción de correos para esta comunidad.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={provider} onValueChange={setProvider} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="gmail">Gmail / Google Workspace</TabsTrigger>
                        <TabsTrigger value="smtp">SMTP Personalizado</TabsTrigger>
                    </TabsList>

                    <TabsContent value="gmail" className="space-y-6 pt-2">
                        <div className="rounded-md bg-blue-50 p-4 border border-blue-100 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium text-blue-900">Integración con Google</h4>
                                <p className="text-sm text-blue-700">
                                    Conecta tu cuenta de Google para sincronizar correos automáticamente.
                                </p>
                            </div>
                        </div>

                        {integration ? (
                            <div className="rounded-lg border p-4 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Conectado correctamente</p>
                                        <p className="text-xs text-muted-foreground">{integration.email}</p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" onClick={handleGoogleConnect}>
                                    Re-conectar
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <Button
                                    variant="outline"
                                    className="w-full justify-between h-12 px-4 bg-white hover:bg-gray-50 border-gray-200"
                                    onClick={handleGoogleConnect}
                                >
                                    <div className="flex items-center gap-3">
                                        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                                            <path
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                fill="#4285F4"
                                            />
                                            <path
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                fill="#34A853"
                                            />
                                            <path
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26::84"
                                                fill="#FBBC05"
                                            />
                                            <path
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                fill="#EA4335"
                                            />
                                        </svg>
                                        <span className="font-medium text-gray-700">Conectar con Google</span>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-gray-400" />
                                </Button>
                                <p className="text-xs text-muted-foreground text-center">
                                    Serás redirigido a Google para autorizar el acceso.
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="smtp" className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="host">Servidor SMTP (Host)</Label>
                                <Input
                                    id="host"
                                    placeholder="smtp.example.com"
                                    value={smtpHost}
                                    onChange={(e) => setSmtpHost(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="port">Puerto</Label>
                                <Input
                                    id="port"
                                    placeholder="587"
                                    value={smtpPort}
                                    onChange={(e) => setSmtpPort(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user">Usuario / Correo</Label>
                            <Input
                                id="user"
                                placeholder="admin@comunidad.com"
                                value={smtpUser}
                                onChange={(e) => setSmtpUser(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pass">Contraseña</Label>
                            <Input
                                id="pass"
                                type="password"
                                placeholder="••••••••"
                                value={smtpPass}
                                onChange={(e) => setSmtpPass(e.target.value)}
                            />
                        </div>
                    </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <Button onClick={handleSave} disabled={isLoading} className="min-w-[100px]">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function ArrowRight(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
        </svg>
    )
}
