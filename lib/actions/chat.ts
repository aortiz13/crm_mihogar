'use server'

import { searchCommunityContext } from '@/lib/ai/rag'
import { getGemini, CHAT_MODEL } from '@/lib/gemini'
import { SchemaType } from '@google/generative-ai'
import { createActivity } from './activities'
import { getResidentBill, getBillByUnit } from './finance'

export async function chatWithCommunity(communityId: string, messages: any[]) {
    try {
        const lastMessage = messages[messages.length - 1].content

        // 1. Search Context (RAG)
        const contextDocs = await searchCommunityContext(communityId, lastMessage)
        const contextText = contextDocs && contextDocs.length > 0
            ? contextDocs.map((d: any) => d.content_chunk).join('\n---\n')
            : "No se encontraron documentos relevantes en la base de conocimiento."

        const systemPrompt = `Eres un asistente experto en administración de comunidades (Uso Interno). 
        Tienes acceso a dos fuentes de información:
        1. Base de conocimiento: Documentos subidos por la administración (reglamentos, actas, etc).
        2. Información Financiera: Puedes consultar boletas de residentes proporcionando su email O su número de unidad.
        
        Reglas:
        - Esta es una herramienta interna, puedes dar datos si te dan el número de unidad (ej: "unidad 102").
        - Siempre pide el mes y año si no los tienes. El mes debe ser un número del 1 al 12.
        - Si el usuario pregunta por una unidad específica, usa la función 'get_resident_bill_details'.
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
                            description: "Obtiene el desglose detallado de la boleta de un residente.",
                            parameters: {
                                type: SchemaType.OBJECT,
                                properties: {
                                    resident_email: { type: SchemaType.STRING, description: "Email del residente (opcional)" },
                                    unit_number: { type: SchemaType.STRING, description: "Número de unidad/depto (opcional)" },
                                    month: { type: SchemaType.NUMBER, description: "Mes de la boleta (1-12)" },
                                    year: { type: SchemaType.NUMBER, description: "Año de la boleta (ej: 2025)" }
                                },
                                required: ["month", "year"]
                            }
                        }
                    ]
                }
            ],
            systemInstruction: systemPrompt
        })

        // 3. Start Chat
        const chat = model.startChat({
            history: messages.slice(0, -1).map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content || "" }]
            }))
        })

        const result = await chat.sendMessage(lastMessage)
        const response = result.response
        const calls = response.functionCalls()

        let finalResponse = "";
        let usedTools: string[] = [];

        // 4. Handle Function Calls
        if (calls && calls.length > 0) {
            usedTools = calls.map(c => c.name)
            const toolResponses = []

            for (const call of calls) {
                if (call.name === 'get_resident_bill_details') {
                    const args = call.args as any
                    let billData;

                    if (args.unit_number) {
                        // Ensure unit_number is string
                        const unitStr = String(args.unit_number).trim()
                        billData = await getBillByUnit(communityId, unitStr, args.month, args.year)
                    } else if (args.resident_email) {
                        billData = await getResidentBill(args.resident_email, args.month, args.year)
                    } else {
                        billData = { error: "Debes proporcionar un email o número de unidad" }
                    }

                    toolResponses.push({
                        functionResponse: {
                            name: 'get_resident_bill_details',
                            response: { content: JSON.stringify(billData) }
                        }
                    })
                }
            }

            const secondResult = await chat.sendMessage(toolResponses)
            finalResponse = secondResult.response.text()
        } else {
            finalResponse = response.text()
        }

        // 5. Log Activity
        await createActivity({
            type: 'ai_log',
            community_id: communityId,
            contact_id: null,
            title: usedTools.length > 0 ? 'IA Gemini Consultó Finanzas' : 'IA Gemini respondió',
            description: `IA procesó consulta sobre: "${lastMessage.substring(0, 30)}..."`,
            metadata: {
                used_tools: usedTools,
                context_docs_count: contextDocs?.length || 0
            }
        })

        return finalResponse

    } catch (error: any) {
        console.error('Error in chatWithCommunity:', error)
        // Return a more descriptive error for internal debugging
        return `Lo siento, ocurrió un error al consultar la IA: ${error.message || 'Error desconocido'}. Verifique la configuración de Gemini.`
    }
}
