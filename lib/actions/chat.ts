'use server'

import { searchCommunityContext } from '@/lib/ai/rag'
import { getOpenAI } from '@/lib/openai'
import { createActivity } from './activities'

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

    const aiResponse = response.choices[0].message.content

    // 3. Log Activity
    await createActivity({
        type: 'ai_log',
        community_id: communityId,
        contact_id: null, // Chat is global for now, could be per contact in mobile app later
        title: 'Asistente IA respondió',
        description: `La IA respondió sobre: "${lastMessage.substring(0, 50)}..."`,
        metadata: {
            context_docs_count: contextDocs?.length || 0,
            full_response: aiResponse?.substring(0, 100) + '...'
        }
    })

    return aiResponse
}
