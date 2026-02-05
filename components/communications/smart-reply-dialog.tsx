'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TimelineView } from './timeline-view'
import { CrmContextPanel } from './crm-context-panel'
import { Email, sendNewEmail } from '@/lib/actions/communications'
import { getAllIntegrations } from '@/lib/actions/integrations'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Send, Paperclip, Minimize2, Maximize2, X, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface SmartReplyDialogProps {
    isOpen: boolean
    onClose: () => void
    email: Email
    threadMessages: Email[]
}

export function SmartReplyDialog({ isOpen, onClose, email, threadMessages }: SmartReplyDialogProps) {
    const [replyBody, setReplyBody] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [integrations, setIntegrations] = useState<any[]>([])
    const [selectedFrom, setSelectedFrom] = useState('')

    useEffect(() => {
        const fetchIntegrations = async () => {
            const data = await getAllIntegrations()
            setIntegrations(data)

            // Try to find the best default "From"
            const currentCommunityIntegration = data.find(i => i.community_id === email.community_id)
            if (currentCommunityIntegration) {
                setSelectedFrom(currentCommunityIntegration.email)
            } else if (data.length > 0) {
                setSelectedFrom(data[0].email)
            } else {
                setSelectedFrom('soporte@mihogar.com') // Fallback
            }
        }
        fetchIntegrations()
    }, [email.community_id])

    // Combine current email with thread for the full picture if not already included
    // Assuming threadMessages includes history.
    const allMessages = threadMessages.length > 0 ? threadMessages : [email]

    const handleSend = async () => {
        if (!replyBody.trim()) return

        setIsSending(true)
        const toastId = toast.loading("Enviando respuesta...")

        try {
            const res = await sendNewEmail({
                communityId: email.community_id || '',
                fromEmail: selectedFrom, // Pass the selected sender
                to: email.sender_email,
                subject: email.subject.startsWith('Re:') ? email.subject : `Re: ${email.subject}`,
                body: replyBody
            })

            if (res.error) {
                toast.error("Error al enviar", { id: toastId, description: res.error })
            } else {
                toast.success("Respuesta enviada", { id: toastId })
                setReplyBody('')
                onClose()
            }
        } catch (error) {
            toast.error("Error inesperado", { id: toastId })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] sm:max-w-[1240px] w-full h-[92vh] p-0 gap-0 overflow-hidden bg-background">
                <DialogTitle className="sr-only">Responder Correo</DialogTitle>
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b bg-card shrink-0">
                        <div className="flex flex-col">
                            <h2 className="text-xl font-bold">
                                {email.subject.replace(/^Re:\s*/, '')}
                            </h2>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                Respondiendo a: <span className="font-semibold text-foreground">{email.sender_name || email.sender_email}</span>
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ResizablePanelGroup direction="horizontal" className="h-full">
                            <ResizablePanel defaultSize={70} minSize={50}>
                                <div className="h-full relative">
                                    <ScrollArea className="absolute inset-0 bg-muted/5">
                                        <div className="flex flex-col gap-6 p-6 pb-32">
                                            {/* Editor Card (TOP) */}
                                            <div className="border rounded-xl shadow-xl bg-background overflow-hidden border-blue-100 ring-1 ring-blue-50 shrink-0">
                                                <div className="p-6 space-y-4">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-muted-foreground w-12 text-right">To</span>
                                                            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full border border-muted-foreground/20 text-xs font-semibold">
                                                                {email.sender_name || email.sender_email} <X className="h-3 w-3 cursor-pointer" />
                                                            </div>
                                                            <span className="text-blue-600 font-bold ml-4 cursor-pointer">cc</span>
                                                            <span className="text-blue-600 font-bold ml-2 cursor-pointer">bcc</span>
                                                        </div>
                                                        <div className="text-muted-foreground font-medium">
                                                            {format(new Date(), "MMM d, yyyy", { locale: es })}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm h-9">
                                                        <span className="font-bold text-muted-foreground w-12 text-right">From</span>
                                                        <Select value={selectedFrom} onValueChange={setSelectedFrom}>
                                                            <SelectTrigger className="border-0 bg-transparent hover:bg-muted font-medium text-foreground/70 h-8 px-2 shadow-none focus:ring-0">
                                                                <SelectValue placeholder="Seleccionar remitente" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {integrations.length > 0 ? (
                                                                    integrations.map(integration => (
                                                                        <SelectItem key={integration.email} value={integration.email}>
                                                                            {integration.email}
                                                                        </SelectItem>
                                                                    ))
                                                                ) : (
                                                                    <SelectItem value="soporte@mihogar.com">soporte@mihogar.com</SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="font-bold text-muted-foreground w-12 text-right">Subject</span>
                                                        <span className="font-bold">Re: {email.subject.replace(/^Re:\s*/, '')}</span>
                                                    </div>

                                                    <div className="border-t pt-4">
                                                        <Textarea
                                                            value={replyBody}
                                                            onChange={(e) => setReplyBody(e.target.value)}
                                                            placeholder="Escribe tu respuesta aquí..."
                                                            className="min-h-[220px] border-0 focus-visible:ring-0 resize-none p-0 text-base leading-relaxed bg-transparent"
                                                        />
                                                    </div>

                                                    <div className="flex items-center justify-between border-t pt-4 mt-4">
                                                        <div className="flex items-center gap-4 text-muted-foreground">
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 px-0"><span className="font-bold">B</span></Button>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 px-0 font-serif italic">I</Button>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 px-0 underline">U</Button>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 px-0"><Paperclip className="h-4 w-4" /></Button>
                                                        </div>
                                                        <div className="flex gap-3">
                                                            <Button variant="outline" onClick={onClose} className="h-10 px-6 font-bold border-muted-foreground/30">
                                                                Cancelar
                                                            </Button>
                                                            <Button onClick={handleSend} disabled={isSending} className="h-10 px-6 font-bold bg-blue-600 hover:bg-blue-700 shadow-blue-200 shadow-lg">
                                                                {isSending ? 'Enviando...' : (
                                                                    <>
                                                                        Enviar <Send className="h-4 w-4 ml-2" />
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Timeline (BELOW) */}
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-center gap-4 px-2">
                                                    <div className="h-px bg-muted flex-1" />
                                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground whitespace-nowrap">Historial de Comunicación</p>
                                                    <div className="h-px bg-muted flex-1" />
                                                </div>
                                                <TimelineView messages={allMessages} />
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </div>
                            </ResizablePanel>

                            <ResizableHandle withHandle />

                            <ResizablePanel defaultSize={30} minSize={20} className="bg-muted/10 border-l shadow-inner">
                                <div className="h-full relative">
                                    <ScrollArea className="absolute inset-0">
                                        <div className="p-6">
                                            <CrmContextPanel
                                                email={email.sender_email}
                                                name={email.sender_name || ''}
                                                communityId={email.community_id || ''}
                                            />
                                        </div>
                                    </ScrollArea>
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
