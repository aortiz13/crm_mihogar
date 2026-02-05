'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export default function AssistantPage() {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hola, soy tu asistente virtual de Mi Hogar. ¿En qué puedo ayudarte hoy?' }
    ])
    const [input, setInput] = useState('')

    const handleSend = () => {
        if (!input.trim()) return

        const newMessage: Message = { role: 'user', content: input }
        setMessages(prev => [...prev, newMessage])
        setInput('')

        // Mock AI Response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Entiendo tu consulta. Estoy buscando en la base de datos de reglamentos y gastos comunes... (Funcionalidad RAG simulada)'
            }])
        }, 1000)
    }

    return (
        <div className="container max-w-4xl mx-auto py-6 h-[calc(100vh-theme(spacing.16))] flex flex-col">
            <div className="mb-4">
                <h1 className="text-3xl font-bold tracking-tight">Asistente IA</h1>
                <p className="text-muted-foreground">Consulta información sobre las comunidades.</p>
            </div>

            <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="border-b">
                    <div className="flex items-center gap-2">
                        <Bot className="h-6 w-6 text-blue-600" />
                        <CardTitle>Chat</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                    <ScrollArea className="h-full p-4">
                        <div className="flex flex-col gap-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={cn("flex gap-3 max-w-[80%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                                    <div className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                                        msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                    </div>
                                    <div className={cn(
                                        "rounded-lg px-4 py-2 text-sm",
                                        msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="border-t p-4">
                    <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                        <Input
                            placeholder="Escribe tu pregunta..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <Button type="submit" size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
