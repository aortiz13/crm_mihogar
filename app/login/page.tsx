import { login, signup } from './actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Mi Hogar CRM</CardTitle>
                    <CardDescription>
                        Ingrese sus credenciales para acceder al sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="usuario@mihogar.com" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input id="password" name="password" type="password" required />
                            <div className="flex justify-end">
                                <Link href="/login/forgot-password" className="text-xs text-blue-600 hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="role">Rol (Solo para registro)</Label>
                            <select
                                id="role"
                                name="role"
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                defaultValue="operator"
                            >
                                <option value="operator">Operador</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2 mt-4">
                            <Button formAction={login} className="w-full">Iniciar Sesión</Button>
                            {/* Signup hidden for production or strictly controlled? PRD mentions admin manages users. 
                   But keeping signup for initial dev/testing might be useful, or just rely on Admin adding users.
                   The PRD says "Admin... Can manage users". 
                   I'll leave signup as a secondary action or hidden, but for now helpful to create first admin.
                */}
                            <Button formAction={signup} variant="outline" className="w-full">Registrarse (Solo Desarrollo)</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
