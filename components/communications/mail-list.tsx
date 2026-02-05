'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Email } from '@/lib/actions/communications'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ThreadView } from './thread-view'
import { ChevronDown, ChevronRight, Mail } from 'lucide-react'
import { SmartReplyDialog } from './smart-reply-dialog'

interface MailListProps {
    items: Email[]
    selectedThreadMessages?: Email[] // Passed from server if an ID is selected
}

export function MailList({ items, selectedThreadMessages }: MailListProps) {
    const searchParams = useSearchParams()
    const selectedId = searchParams.get('id')
    const [replyingEmail, setReplyingEmail] = useState<Email | null>(null)

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col p-2">
                {items.length === 0 && (
                    <div className="text-center text-muted-foreground py-10 text-sm">
                        No hay mensajes aquí.
                    </div>
                )}
                {items.map((item) => {
                    const expanded = selectedId === item.id

                    return (
                        <div key={item.id} className="mb-2">
                            {/* Row Wrapper */}
                            <Link
                                href={expanded ? `/dashboard/communications?folder=${item.status}&communityId=${item.community_id || ''}` : `/dashboard/communications?id=${item.id}&folder=${item.status}&communityId=${item.community_id || ''}`}
                                className={cn(
                                    "flex items-center gap-4 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent group cursor-pointer",
                                    expanded ? "bg-accent border-primary/20" : "bg-card"
                                )}
                                scroll={false} // Prevent full scroll reset
                            >
                                {/* Checkbox placeholder */}
                                <div className="h-4 w-4 border rounded items-center justify-center hidden sm:flex text-transparent group-hover:border-foreground/50 transition-colors" />

                                {/* Icon / Avatar Placeholder */}
                                <div className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border",
                                    item.status === 'new' ? "bg-blue-100 text-blue-600 border-blue-200" : "bg-muted text-muted-foreground"
                                )}>
                                    <Mail className="h-4 w-4" />
                                </div>

                                <div className="grid gap-1 flex-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={cn("font-medium", item.status === 'new' ? "font-bold" : "")}>
                                                {item.sender_name || item.sender_email}
                                            </span>
                                            {item.status === 'new' && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(item.received_at), { addSuffix: true, locale: es })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate max-w-[200px] sm:max-w-[400px]">
                                            {item.subject}
                                        </span>
                                        <span className="text-muted-foreground text-xs truncate flex-1">
                                            - {item.body.substring(0, 60)}...
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {/* Expanded Content */}
                            {expanded && selectedThreadMessages && (
                                <div className="ml-0 sm:ml-4 border-l-2 border-primary/10 pl-0 mt-1">
                                    <ThreadView
                                        messages={selectedThreadMessages}
                                        onReply={() => setReplyingEmail(item)}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Smart Reply Dialog for List View */}
            {replyingEmail && selectedThreadMessages && (
                <SmartReplyDialog
                    isOpen={!!replyingEmail}
                    onClose={() => setReplyingEmail(null)}
                    email={replyingEmail}
                    threadMessages={selectedThreadMessages}
                />
            )}
        </ScrollArea>
    )
}
