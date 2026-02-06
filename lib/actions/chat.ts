'use server'

import { searchCommunityContext } from '@/lib/ai/rag'
import { getGemini, CHAT_MODEL } from '@/lib/gemini'
import { SchemaType } from '@google/generative-ai'
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
    - Si el usuario pregunta por su cuenta o boleta, usa la función 'get_resident_bill_details'.
    - Si no tienes el email, el mes o el año, PÍDELOS amablemente antes de intentar usar la función.
    - El mes debe ser un número del 1 al 12.
    - Responde de forma clara y profesional.
    
    Contexto de Guía:
    ${contextText}`

    // 2. Setup Gemini Model with Tools
    const genAI = getGemini()
    const model = genAI.getGenerativeModel({
        model: CHAT_MODEL,
        tools: [
            {
                functionDeclarations: [
                    {
                        name: "get_resident_bill_details",
                        description: "Obtiene el desglose detallado de la boleta de un residente para un mes específico.",
                        parameters: {
                            type: SchemaType.OBJECT,
                            properties: {
                                resident_email: { type: SchemaType.STRING, description: "Email registrado del residente" },
                                month: { type: SchemaType.NUMBER, description: "Mes de la boleta (1-12)" },
                                year: { type: SchemaType.NUMBER, description: "Año de la boleta (ej: 2025)" }
                            },
                            required: ["resident_email", "month", "year"]
                        }
                    }
                ]
            }
        ],
        systemInstruction: systemPrompt
    })

    // 3. Start Chat and handle interaction
    // Convert OpenAI style messages to Gemini style
    const history = messages.slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
    }))

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(lastMessage)
    const response = result.response
    const calls = response.functionCalls()

    let finalResponse = response.text()
    let usedFunctions: string[] = []

    // 4. Handle Function Calls
    if (calls && calls.length > 0) {
        usedFunctions = calls.map(c => c.name)
        const toolResponses = []

        for (const call of calls) {
            if (call.name === 'get_resident_bill_details') {
                const args = call.args as any
                const billData = await getResidentBill(args.resident_email, args.month, args.year)

                toolResponses.push({
                    functionResponse: {
                        name: 'get_resident_bill_details',
                        response: { content: JSON.stringify(billData) }
                    }
                })
            }
        }

        // Send tool responses back to Gemini
        const secondResult = await chat.sendMessage(toolResponses)
        finalResponse = secondResult.response.text()
    }

    // 5. Log Activity
    await createActivity({
        type: 'ai_log',
        community_id: communityId,
        contact_id: null,
        title: 'Asistente IA Gemini respondió',
        description: `IA (Google) procesó consulta sobre: "${lastMessage.substring(0, 50)}..."`,
        metadata: {
            used_tools: usedFunctions,
            context_docs_count: contextDocs?.length || 0
        }
    })

    return finalResponse
}
