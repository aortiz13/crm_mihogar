'use server'

import { searchCommunityContext } from '@/lib/ai/rag'
import { getOpenAI } from '@/lib/openai'
import { createActivity } from './activities'
import { getResidentBill } from './finance'

export async function chatWithCommunity(communityId: string, messages: any[]) {
    const lastMessage = messages[messages.length - 1].content

    // 1. Search Context (RAG)
    const contextDocs = await searchCommunityContext(communityId, lastMessage)
    const contextText = contextDocs && contextDocs.length > 0
        ? contextDocs.map((d: any) => d.content_chunk).join('\n---\n')
        : "No se encontraron documentos relevantes en la base de conocimiento."

    const systemPrompt = `Eres un asistente experto en administración de comunidades. 
    Tienes acceso a dos fuentes de información:
    1. Base de conocimiento: Documentos subidos por la administración (reglamentos, actas, etc).
    2. Información Financiera: Puedes consultar boletas de residentes si te proporcionan su email y el mes/año deseado.
    
    Reglas:
    - Si el usuario pregunta por su cuenta o boleta, usa la herramienta 'get_resident_bill_details'.
    - Si no tienes el email, el mes o el año, PÍDELOS amablemente antes de intentar usar la herramienta.
    - El mes debe ser un número del 1 al 12.
    - Responde de forma clara y profesional.
    
    Contexto de Guía:
    ${contextText}`

    const tools: any[] = [
        {
            type: "function",
            function: {
                name: "get_resident_bill_details",
                description: "Obtiene el desglose detallado de la boleta de un residente para un mes específico.",
                parameters: {
                    type: "object",
                    properties: {
                        resident_email: { type: "string", description: "Email registrado del residente" },
                        month: { type: "integer", description: "Mes de la boleta (1-12)" },
                        year: { type: "integer", description: "Año de la boleta (ej: 2025)" }
                    },
                    required: ["resident_email", "month", "year"]
                }
            }
        }
    ]

    // 2. Initial Call to AI
    const openai = getOpenAI()
    const runner = await openai.chat.completions.create({
        model: 'gpt-4o', // Using a better model for tools
        messages: [
            { role: 'system', content: systemPrompt },
            ...messages
        ],
        tools
    })

    let finalResponse = runner.choices[0].message.content
    const toolCalls = runner.choices[0].message.tool_calls

    // 3. Handle Tool Calls
    if (toolCalls && toolCalls.length > 0) {
        const toolMessages = [...messages]
        toolMessages.push(runner.choices[0].message)

        for (const toolCall of toolCalls) {
            const tc = toolCall as any
            if (tc.function?.name === 'get_resident_bill_details') {
                const args = JSON.parse(tc.function.arguments)
                const billData = await getResidentBill(args.resident_email, args.month, args.year)

                toolMessages.push({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: JSON.stringify(billData)
                })
            }
        }

        const secondResponse = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                ...toolMessages
            ]
        })
        finalResponse = secondResponse.choices[0].message.content
    }

    // 4. Log Activity
    await createActivity({
        type: 'ai_log',
        community_id: communityId,
        contact_id: null,
        title: 'Asistente IA respondió (Finanzas)',
        description: `IA procesó consulta sobre: "${lastMessage.substring(0, 50)}..."`,
        metadata: {
            used_tools: toolCalls?.map((t: any) => t.function?.name) || [],
            context_docs_count: contextDocs?.length || 0
        }
    })

    return finalResponse
}
