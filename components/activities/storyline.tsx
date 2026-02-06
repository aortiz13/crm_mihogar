'use client'

import { Activity } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Mail,
    CheckSquare,
    Bot,
    Calendar,
    Wrench,
    AlertCircle,
    MessageSquare,
    CheckCircle2,
    Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface StorylineProps {
    activities: Activity[]
    title?: string
}

export function Storyline({ activities, title = "Actividades" }: StorylineProps) {
    const getIcon = (type: Activity['type']) => {
        switch (type) {
            case 'email_in':
            case 'email_out':
                return <Mail className="h-4 w-4" />
            case 'task_created':
                return <Clock className="h-4 w-4" />
            case 'task_completed':
                return <CheckCircle2 className="h-4 w-4 text-green-500" />
            case 'ai_log':
                return <Bot className="h-4 w-4 text-blue-500" />
            case 'maintenance':
                return <Wrench className="h-4 w-4 text-orange-500" />
            case 'announcement':
                return <Calendar className="h-4 w-4 text-purple-500" />
            case 'global_event':
                return <AlertCircle className="h-4 w-4 text-red-500" />
            default:
                return <MessageSquare className="h-4 w-4" />
        }
    }

    const getBadge = (type: Activity['type']) => {
        switch (type) {
            case 'email_in': return <Badge variant="outline">Email Recibido</Badge>
            case 'email_out': return <Badge variant="outline">Email Enviado</Badge>
            case 'ai_log': return <Badge variant="secondary">Análisis IA</Badge>
            case 'task_created': return <Badge variant="outline">Tarea Nueva</Badge>
            case 'task_completed': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completada</Badge>
            case 'maintenance': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Mantenimiento</Badge>
            case 'global_event': return <Badge variant="destructive">Incidencia</Badge>
            case 'announcement': return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Anuncio</Badge>
            default: return null
        }
    }

    if (activities.length === 0) {
        return (
            <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                    No hay actividades registradas aún.
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                    {activities.map((activity) => (
                        <div key={activity.id} className="relative flex items-start group">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-muted shadow-sm z-10">
                                {getIcon(activity.type)}
                            </div>
                            <div className="flex-1 ml-4 pt-0.5">
                                <div className="flex items-center justify-between gap-2">
                                    <h4 className="font-semibold text-slate-900">{activity.title}</h4>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {format(new Date(activity.created_at), "d MMM, HH:mm", { locale: es })}
                                    </span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                    {getBadge(activity.type)}
                                    {activity.metadata?.author && (
                                        <span className="text-xs text-muted-foreground lowercase">por {activity.metadata.author}</span>
                                    )}
                                </div>
                                {activity.description && (
                                    <p className="mt-2 text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                        {activity.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
