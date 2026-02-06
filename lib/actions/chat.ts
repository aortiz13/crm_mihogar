'use server'

import { searchCommunityContext } from '@/lib/ai/rag'
import { getOpenAI } from '@/lib/openai'

export async function chatWithCommunity(communityId: string, messages: any[]) {
    const lastMessage = messages[messages.length - 1].content

    // 1. Search Context
    const contextDocs = await searchCommunityContext(communityId, lastMessage)

    const contextText = contextDocs && contextDocs.length > 0
        ? contextDocs.map((d: any) => d.content_chunk).join('\n---\n')
        : "No se encontraron documentos relevantes en la base de conocimiento."

    const systemPrompt = `Eres un asistente útil para la administración de edificios. 
  Contesta la pregunta del usuario basándote SOLAMENTE en el siguiente contexto proporcionado.
  Si la respuesta no está en el contexto, di que no tienes esa información.
  
  Contexto:
  ${contextText}`

    // 2. Generate Response
    const response = await getOpenAI().chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
    })

    return response.choices[0].message.content
}
