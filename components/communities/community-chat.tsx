'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bot, Send, User, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chatWithCommunity } from '@/lib/actions/chat'
import ReactMarkdown from 'react-markdown'

export function CommunityChat({ communityId }: { communityId: string }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: '¿Qué necesitas saber sobre esta comunidad? Puedo buscar en los documentos subidos.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await chatWithCommunity(communityId, [...messages, userMessage])

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response || "Lo siento, no pude generar una respuesta."
      }])
    } catch (error) {
      console.error("Chat Error:", error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Ocurrió un error al consultar la IA."
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Chat con IA</CardTitle>
        <CardDescription>Prueba de concepto RAG (Retrieval Augmented Generation).</CardDescription>
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
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted prose prose-sm dark:prose-invert"
                )}>
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <span className="block mb-1 last:mb-0">{children}</span>,
                      strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc ml-4 mb-2">{children}</ul>,
                      li: ({ children }) => <li className="mb-1">{children}</li>
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div className="rounded-lg px-4 py-2 text-sm bg-muted text-muted-foreground">
                  Pensando...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <form className="flex w-full gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
          <Input
            placeholder="Ej: ¿Cuáles son las reglas de la piscina?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
