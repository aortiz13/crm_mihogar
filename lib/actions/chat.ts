'use server'

import { createClient } from '@/lib/supabase/server'

export async function chatWithCommunity(communityId: string, messages: any[]) {
    try {
        const supabase = await createClient()

        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('community-chat', {
            body: { communityId, messages }
        })

        if (error) {
            console.error('Edge Function error:', error)
            throw new Error(error.message || 'Error en la Edge Function de Supabase')
        }

        return data.response

    } catch (error: any) {
        console.error('Error in chatWithCommunity:', error)
        return `Lo siento, ocurrió un error al consultar la IA (Edge): ${error.message || 'Error desconocido'}. Verifique la configuración en Supabase.`
    }
}
