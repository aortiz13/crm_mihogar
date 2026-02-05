'use client'

import { useState } from 'react'
import { Email } from '@/lib/actions/communications'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface TimelineViewProps {
    messages: Email[]
}

export function TimelineView({ messages }: TimelineViewProps) {
    // Sort newest to oldest for the list
    const sortedMessages = [...messages].sort((a, b) =>
        new Date(b.received_at || 0).getTime() - new Date(a.received_at || 0).getTime()
    )

    const [expandedIds, setExpandedIds] = useState<string[]>([])

    const toggleExpand = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    return (
        <div className="flex flex-col p-4 gap-2">
            {sortedMessages.map((msg) => {
                const isExpanded = expandedIds.includes(msg.id)
                const isMe = msg.metadata?.type === 'outgoing' || msg.sender_email === 'me'

                return (
                    <div key={msg.id} className="border rounded-lg bg-card overflow-hidden shadow-sm transition-all hover:border-muted-foreground/30">
                        <div
                            className="flex items-center gap-4 px-4 py-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleExpand(msg.id)}
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                                <span className="font-medium truncate text-foreground/80 shrink-0">
                                    {msg.sender_email}
                                </span>
                                <span className="text-muted-foreground truncate flex-1 block">
                                    {!isExpanded && msg.body.substring(0, 100)}
                                    {!isExpanded && msg.body.length > 100 && '...'}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap font-medium">
                                {format(new Date(msg.received_at), "MMM d, yyyy", { locale: es })}
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="px-5 md:px-12 py-5 border-t bg-muted/5 animate-in fade-in slide-in-from-top-1 duration-200">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border shadow-sm">
                                            <AvatarFallback className={cn("text-xs font-bold", isMe ? "bg-primary text-primary-foreground" : "bg-muted")}>
                                                {msg.sender_name?.[0] || '?'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <p className="text-sm font-bold leading-none">{msg.sender_name || msg.sender_email}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">{msg.sender_email}</p>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/20 px-2 py-1 rounded">
                                        {format(new Date(msg.received_at), "PPpp", { locale: es })}
                                    </div>
                                </div>
                                <div
                                    className="text-[15px] leading-relaxed prose prose-sm max-w-none text-foreground/90 border-l-2 border-primary/20 pl-4"
                                    dangerouslySetInnerHTML={{ __html: msg.body }}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
