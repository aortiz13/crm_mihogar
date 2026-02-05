'use client'

import { Email } from '@/lib/actions/communications'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Reply } from 'lucide-react'

interface ThreadViewProps {
    messages: Email[]
    onReply: () => void
}

export function ThreadView({ messages, onReply }: ThreadViewProps) {
    return (
        <div className="flex flex-col gap-4 p-4 bg-muted/30 border-t border-b animate-in slide-in-from-top-2 duration-300">
            {messages.map((msg, index) => (
                <div key={msg.id} className="border rounded-lg bg-card shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-4 bg-muted/10 border-b">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback>{msg.sender_name?.[0] || msg.sender_email[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-sm font-semibold">{msg.sender_name || msg.sender_email}</p>
                                <p className="text-xs text-muted-foreground">{msg.sender_email}</p>
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {format(new Date(msg.received_at), "PP p", { locale: es })}
                        </span>
                    </div>
                    <div className="p-4 text-sm whitespace-pre-wrap">
                        {msg.body}
                    </div>
                </div>
            ))}

            <div className="flex justify-end pt-2">
                <Button onClick={onReply} className="gap-2">
                    <Reply className="h-4 w-4" />
                    Responder
                </Button>
            </div>
        </div>
    )
}
