import { GoogleGenerativeAI } from '@google/generative-ai'

let genAIInstance: GoogleGenerativeAI | null = null

export function getGemini() {
    if (genAIInstance) return genAIInstance

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
        throw new Error('Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable.')
    }

    genAIInstance = new GoogleGenerativeAI(apiKey)
    return genAIInstance
}

export const EMBEDDING_MODEL = 'gemini-embedding-001'
export const CHAT_MODEL = 'gemini-2.5-flash'
