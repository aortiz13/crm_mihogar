import { getOpenAI } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

export async function generateEmbedding(text: string) {
    const response = await getOpenAI().embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '),
    })
    return response.data[0].embedding
}

export async function processDocument(communityId: string, documentId: string, content: string) {
    const supabase = await createClient()

    // 1. Chunking (Simple split by paragraphs or chars for now)
    const chunks = content.split('\n\n').filter(c => c.length > 50) // Basic paragraph splitting

    // 2. Generate embeddings and prepare rows
    const embeddingData = await Promise.all(
        chunks.map(async (chunk) => {
            const embedding = await generateEmbedding(chunk)
            return {
                community_id: communityId,
                document_id: documentId,
                content_chunk: chunk,
                embedding,
            }
        })
    )

    // 3. Store in Supabase
    const { error } = await supabase.from('document_embeddings').insert(embeddingData)

    if (error) throw error

    // 4. Update Document Status
    await supabase
        .from('community_documents')
        .update({ status: 'indexed' })
        .eq('id', documentId)
}

export async function searchCommunityContext(communityId: string, query: string) {
    const supabase = await createClient()
    const queryEmbedding = await generateEmbedding(query)

    // Use pgvector similarity search
    const { data, error } = await supabase.rpc('match_community_documents', {
        match_count: 5,
        query_embedding: queryEmbedding,
        filter_community_id: communityId,
        match_threshold: 0.5,
    })

    // Fallback if RPC doesn't exist (simulated behavior for now or require creating RPC)
    if (error) {
        console.error("Vector search error (RPC match_community_documents missing?):", error)
        return []
    }

    return data
}
