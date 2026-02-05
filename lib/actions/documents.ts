'use server'

import { createClient } from '@/lib/supabase/server'
import { CommunityDocument } from '@/types'
import { processDocument } from '@/lib/ai/rag'
import { revalidatePath } from 'next/cache'
const PDFParser = require("pdf2json");

export async function getCommunityDocuments(communityId: string): Promise<CommunityDocument[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('community_documents')
        .select('*')
        .eq('community_id', communityId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching documents:', error)
        return []
    }

    return data as CommunityDocument[]
}

export async function uploadDocument(communityId: string, formData: FormData) {
    const file = formData.get('file') as File
    if (!file) {
        return { error: 'No file provided' }
    }

    const supabase = await createClient()

    // 1. Upload to Storage (Simulated for now, just getting a public URL string mock)
    // In a real app: await supabase.storage.from('community-documents').upload(...)
    const fileName = file.name
    const mockUrl = `https://mock-storage.com/${fileName}`

    // 2. Insert into DB
    const { data: doc, error } = await supabase
        .from('community_documents')
        .insert({
            community_id: communityId,
            filename: fileName,
            file_url: mockUrl,
            content_type: file.type,
            status: 'processing'
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating document record:', error)
        return { error: 'Failed to save document metadata' }
    }

    // 3. Process RAG (Extract text & Embed)
    // For this prototype, we'll extract text from a mock text file or just raw text if it's small,
    // or just use a dummy text for PDFs since we don't have a parser set up yet.

    try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        let indexableContent = ''

        if (file.type === 'application/pdf') {
            const pdfParser = new PDFParser(null, 1); // 1 = text content only

            indexableContent = await new Promise((resolve, reject) => {
                pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
                pdfParser.on("pdfParser_dataReady", () => {
                    // getRawTextContent() is simpler but let's just use the raw text property from json if needed or render
                    // Actually, pdf2json's getRawTextContent() matches exactly what we need
                    resolve(pdfParser.getRawTextContent());
                });
                pdfParser.parseBuffer(buffer);
            });
        } else {
            indexableContent = new TextDecoder("utf-8").decode(arrayBuffer)
        }

        if (!indexableContent || indexableContent.length < 10) {
            console.warn("Extracted content is too short or empty.")
            // Optional: throw error or continue with warning
        }

        await processDocument(communityId, doc.id, indexableContent)

        // Revalidate
        revalidatePath(`/dashboard/communities/${communityId}`)
        return { success: true }
    } catch (err) {
        console.error('RAG Indexing failed:', err)
        return { error: 'Document saved but indexing failed' }
    }
}
