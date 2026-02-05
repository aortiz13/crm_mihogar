import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Inbox, CheckSquare, Zap, Users } from 'lucide-react'

async function getDashboardStats() {
    const supabase = await createClient()

    // Execute parallel queries
    const [
        { count: newEmails },
        { count: pendingTasks },
        { count: communities },
        { count: resolvedEmails } // Simplified metric for AI resolution for now
    ] = await Promise.all([
        supabase.from('communications').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'todo'),
        supabase.from('communities').select('*', { count: 'exact', head: true }),
        supabase.from('communications').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
    ])

    return {
        newEmails: newEmails || 0,
        pendingTasks: pendingTasks || 0,
        communities: communities || 0,
        resolvedEmails: resolvedEmails || 0,
    }
}

export default async function DashboardPage() {
    const stats = await getDashboardStats()

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Inicio</h1>
                <p className="text-muted-foreground">Resumen de actividad de Mi Hogar.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Correos Nuevos</CardTitle>
                        <Inbox className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.newEmails}</div>
                        <p className="text-xs text-muted-foreground">
                            requieren atención inmediata
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
                        <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingTasks}</div>
                        <p className="text-xs text-muted-foreground">
                            en el tablero Kanban
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Comunidades</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.communities}</div>
                        <p className="text-xs text-muted-foreground">
                            gestionadas activamente
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Casos Resueltos</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.resolvedEmails}</div>
                        <p className="text-xs text-muted-foreground">
                            +19% este mes (Proyección)
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Future Charts Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-md m-4">
                            Gráfico de Actividad (Próximamente)
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Resumen IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <span className="text-sm font-medium leading-none">Efectividad de Respuestas</span>
                                <span className="ml-auto font-bold">85%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[85%]"></div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                La IA ha borrador el 85% de las respuestas de hoy.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
