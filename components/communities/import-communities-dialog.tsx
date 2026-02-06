'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Import, Upload, Check, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { bulkImportCommunities } from '@/lib/actions/communities'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

const DB_FIELDS = [
    { label: 'Nombre de Comunidad *', value: 'name' },
    { label: 'Dirección *', value: 'address' },
    { label: 'Ciudad *', value: 'city' },
    { label: 'Unidades', value: 'unit_count' },
    { label: 'Email Admin', value: 'admin_email_contact' },
]

export function ImportCommunitiesDialog() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload')
    const [fileData, setFileData] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [updateIfExists, setUpdateIfExists] = useState(false)

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            const bstr = event.target?.result
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws)

            if (data.length > 0) {
                setFileData(data)
                setHeaders(Object.keys(data[0] as any))
                setStep('mapping')
            } else {
                toast.error('El archivo está vacío')
            }
        }
        reader.readAsBinaryString(file)
    }

    const handleImport = async () => {
        if (!mapping.name || !mapping.address) {
            toast.error('Nombre y Dirección son campos obligatorios')
            return
        }

        setLoading(true)
        try {
            // Reverse mapping for the server action: ExcelHeader -> DBField
            const finalMapping: Record<string, string> = {}
            Object.entries(mapping).forEach(([dbField, excelHeader]) => {
                finalMapping[excelHeader] = dbField
            })

            const result = await bulkImportCommunities(fileData, finalMapping, { updateIfExists })

            if (result.success) {
                toast.success(`Importación completada: ${result.imported} creados/actualizados, ${result.skipped} omitidos, ${result.errors} errores.`)
                setOpen(false)
                reset()
            } else {
                toast.error('Error en la importación')
            }
        } catch (error) {
            toast.error('Ocurrió un error inesperado')
        } finally {
            setLoading(false)
        }
    }

    const reset = () => {
        setStep('upload')
        setFileData([])
        setHeaders([])
        setMapping({})
        setUpdateIfExists(false)
    }

    const isMappingComplete = mapping.name && mapping.address

    return (
        <Dialog open={open} onOpenChange={(val: boolean) => { setOpen(val); if (!val) reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Import className="h-4 w-4 mr-2" />
                    Importar Comunidades
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Importar Comunidades</DialogTitle>
                    <DialogDescription>
                        Carga masiva de edificios desde Excel o CSV con geolocalización automática.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden py-4">
                    {step === 'upload' && (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 hover:bg-muted/50 transition-colors cursor-pointer relative">
                            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground text-center">
                                Selecciona un archivo .xlsx o .csv para comenzar
                            </p>
                            <input
                                type="file"
                                accept=".xlsx, .xls, .csv"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                            />
                        </div>
                    )}

                    {step === 'mapping' && (
                        <ScrollArea className="h-[50vh] pr-4">
                            <div className="space-y-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                                    <div className="flex items-center gap-2 text-amber-800 font-medium mb-1">
                                        <AlertCircle className="h-4 w-4" />
                                        Mapeo de Columnas
                                    </div>
                                    <p className="text-amber-700 text-sm">
                                        Asocia las columnas de tu Excel con los campos del sistema.
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    {DB_FIELDS.map((field) => (
                                        <div key={field.value} className="flex items-center justify-between gap-4 border-b pb-4">
                                            <Label className="font-medium text-sm">{field.label}</Label>
                                            <Select
                                                value={mapping[field.value]}
                                                onValueChange={(val) => setMapping(prev => ({ ...prev, [field.value]: val }))}
                                            >
                                                <SelectTrigger className="w-[280px]">
                                                    <SelectValue placeholder="Seleccionar columna..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {headers.map((header) => (
                                                        <SelectItem key={header} value={header}>{header}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center space-x-2 pt-4">
                                    <Checkbox
                                        id="update_if_exists"
                                        checked={updateIfExists}
                                        onCheckedChange={(val) => setUpdateIfExists(!!val)}
                                    />
                                    <Label htmlFor="update_if_exists" className="text-sm font-normal">
                                        Actualizar comunidades si ya existen (por Nombre o Dirección)
                                    </Label>
                                </div>
                            </div>
                        </ScrollArea>
                    )}

                    {step === 'preview' && (
                        <ScrollArea className="h-[50vh] pr-4">
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm">Vista previa (Primeros 5 registros)</h4>
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-xs">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="px-3 py-2 text-left">Nombre</th>
                                                <th className="px-3 py-2 text-left">Dirección</th>
                                                <th className="px-3 py-2 text-left">Ciudad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fileData.slice(0, 5).map((row, i) => (
                                                <tr key={i} className="border-t">
                                                    <td className="px-3 py-2">{row[mapping.name]}</td>
                                                    <td className="px-3 py-2">{row[mapping.address]}</td>
                                                    <td className="px-3 py-2">{row[mapping.city] || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-muted-foreground italic">
                                    Total de registros a procesar: {fileData.length}
                                </p>
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter className="border-t pt-4">
                    {step === 'mapping' && (
                        <Button
                            variant="default"
                            disabled={!isMappingComplete}
                            onClick={() => setStep('preview')}
                        >
                            Siguiente (Previsualizar)
                        </Button>
                    )}
                    {step === 'preview' && (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setStep('mapping')}>
                                Atrás
                            </Button>
                            <Button onClick={handleImport} disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="h-4 w-4 mr-2" />
                                        Confirmar Importación
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
