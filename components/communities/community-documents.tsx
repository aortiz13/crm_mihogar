'use client'

import { CommunityDocument } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, Upload, RefreshCw } from 'lucide-react'

import { UploadDocumentDialog } from './upload-document-dialog'

interface CommunityDocumentsProps {
    documents: CommunityDocument[]
    communityId: string
}

export function CommunityDocuments({ documents, communityId }: CommunityDocumentsProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Base de Conocimiento</CardTitle>
                    <CardDescription>Documentos indexados para la Inteligencia Artificial.</CardDescription>
                </div>
                <UploadDocumentDialog communityId={communityId} />
            </CardHeader>
            <CardContent>
                {documents.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        No hay documentos en la base de conocimiento.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Fecha</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        {doc.filename}
                                    </TableCell>
                                    <TableCell>{doc.content_type}</TableCell>
                                    <TableCell>
                                        {doc.status === 'indexed' && <Badge className="bg-green-500">Indexado</Badge>}
                                        {doc.status === 'processing' && (
                                            <Badge variant="outline" className="text-blue-500 border-blue-500 flex w-fit items-center gap-1">
                                                <RefreshCw className="h-3 w-3 animate-spin" /> Procesando
                                            </Badge>
                                        )}
                                        {doc.status === 'error' && <Badge variant="destructive">Error</Badge>}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {new Date(doc.created_at).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
