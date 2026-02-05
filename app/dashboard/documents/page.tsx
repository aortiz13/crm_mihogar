import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Upload, MoreVertical, File } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const MOCK_DOCUMENTS = [
    { id: 1, name: 'Reglamento de Copropiedad.pdf', type: 'PDF', size: '2.4 MB', date: '2023-10-01' },
    { id: 2, name: 'Gastos Comunes Noviembre.xlsx', type: 'Excel', size: '1.1 MB', date: '2023-11-28' },
    { id: 3, name: 'Contrato Mantención Ascensores.pdf', type: 'PDF', size: '5.6 MB', date: '2023-08-15' },
]

export default function DocumentsPage() {
    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
                    <p className="text-muted-foreground">Repositorio centralizado de archivos.</p>
                </div>
                <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir Documento
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Archivos Recientes</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Tamaño</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_DOCUMENTS.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        {doc.name}
                                    </TableCell>
                                    <TableCell>{doc.type}</TableCell>
                                    <TableCell>{doc.size}</TableCell>
                                    <TableCell>{doc.date}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem>Descargar</DropdownMenuItem>
                                                <DropdownMenuItem>Renombrar</DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
