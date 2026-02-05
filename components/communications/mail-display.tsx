'use client'

import { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Email } from "@/lib/actions/communications"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Reply, MoreVertical, Trash2, Archive, Inbox, Sparkles } from "lucide-react"
import { SmartReplyDialog } from "./smart-reply-dialog"

interface MailDisplayProps {
    mail: Email | null
    threadMessages?: Email[]
}

export function MailDisplay({ mail, threadMessages = [] }: MailDisplayProps) {
    const [isSmartReplyOpen, setIsSmartReplyOpen] = useState(false)

    if (!mail) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <div className="mb-4 rounded-full bg-muted p-4">
                    <Inbox className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold">Selecciona un mensaje</h3>
                <p className="text-sm">Elige un correo de la lista para ver el hilo completo.</p>
            </div>
        )
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center p-4 py-[14px]">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold truncate max-w-[400px]" title={mail.subject}>
                        {mail.subject}
                    </h2>
                    <Badge variant={mail.status === 'resolved' ? 'secondary' : 'outline'} className="ml-2">
                        {mail.status === 'new' && 'Nuevo'}
                        {mail.status === 'pending' && 'Pendiente'}
                        {mail.status === 'resolved' && 'Resuelto'}
                    </Badge>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        size="sm"
                        className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => setIsSmartReplyOpen(true)}
                    >
                        <Reply className="mr-2 h-4 w-4" />
                        Responder
                    </Button>
                    <Separator orientation="vertical" className="mx-1 h-6" />
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Archive className="h-4 w-4" />
                        <span className="sr-only">Archivar</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Mover a papelera</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Más opciones</span>
                    </Button>
                </div>
            </div>
            <Separator />
            <ScrollArea className="flex-1">
                <div className="flex flex-1 flex-col">
                    <div className="flex items-start p-6 pb-2">
                        <div className="flex items-start gap-4 text-sm w-full">
                            <Avatar className="h-10 w-10">
                                <AvatarImage alt={mail.sender_name || ''} />
                                <AvatarFallback>
                                    {mail.sender_name
                                        ? mail.sender_name
                                            .split(" ")
                                            .map((chunk) => chunk[0])
                                            .join("")
                                        : mail.sender_email[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid gap-1 w-full">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-lg">{mail.sender_name}</span>
                                    {mail.received_at && (
                                        <div className="text-xs text-muted-foreground">
                                            {format(new Date(mail.received_at), "PPpp", { locale: es })}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">De:</span> {mail.sender_email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">Para:</span> mi-hogar-crm@example.com
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 whitespace-pre-wrap p-6 pt-4 text-sm leading-relaxed text-foreground/90">
                        {mail.body}
                    </div>

                    <Separator className="my-4" />

                    {/* AI Suggestion / Quick Reply Area - Simplified as trigger */}
                    {mail.status !== 'resolved' && (
                        <div className="p-6 pt-0">
                            <div
                                className="bg-muted/30 rounded-lg border border-dashed p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setIsSmartReplyOpen(true)}
                            >
                                <div className="flex flex-col items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-blue-500" />
                                    <h4 className="font-medium text-foreground">Redactar Respuesta</h4>
                                    <p className="text-sm text-muted-foreground">Haz clic aquí para abrir el editor avanzado con historial y CRM.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <SmartReplyDialog
                isOpen={isSmartReplyOpen}
                onClose={() => setIsSmartReplyOpen(false)}
                email={mail}
                threadMessages={threadMessages}
            />
        </div>
    )
}
