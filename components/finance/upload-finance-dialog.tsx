'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import { FileUp, Loader2, Check, AlertCircle, Trash2 } from 'lucide-react'
import { FinancePeriod } from '@/types'
import * as XLSX from 'xlsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { processFinanceExcel, createUnitsBatch } from '@/lib/actions/finance'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface UploadFinanceDialogProps {
    period: FinancePeriod
    communityId: string
    onSuccess: () => void
}

export function UploadFinanceDialog({ period, communityId, onSuccess }: UploadFinanceDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'upload' | 'map'>('upload')
    const [headers, setHeaders] = useState<string[]>([])
    const [fileData, setFileData] = useState<string | null>(null)

    // Mapping state
    const [unitCol, setUnitCol] = useState<string>('')
    const [totalCol, setTotalCol] = useState<string>('')
    const [conceptCols, setConceptCols] = useState<string[]>([])

    // Results state
    const [missingUnits, setMissingUnits] = useState<string[] | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setLoading(true)
        const reader = new FileReader()
        reader.onload = (evt) => {
            const bstr = evt.target?.result as string
            const wb = XLSX.read(bstr, { type: 'binary' })
            const wsname = wb.SheetNames[0]
            const ws = wb.Sheets[wsname]
            const data = XLSX.utils.sheet_to_json(ws, { header: 1 })[0] as string[]

            setHeaders(data.filter(h => h)) // Remove empty headers

            // Convert to base64 for server action
            const base64 = btoa(
                new Uint8Array(evt.target?.result as ArrayBuffer)
                    .reduce((data, byte) => data + String.fromCharCode(byte), '')
            )
            // Wait, btoa with arraybuffer is safer with other methods but for now:
            // Since I'm using binary type in read, I should use arraybuffer for base64
        }

        // Let's use a cleaner base64 conversion
        const base64Reader = new FileReader()
        base64Reader.onload = () => {
            const result = base64Reader.result as string
            const base64 = result.split(',')[1]
            setFileData(base64)

            // Still need headers
            const workbookReader = new FileReader()
            workbookReader.onload = (ee) => {
                const data = new Uint8Array(ee.target?.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const firstSheetHeaders = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 })[0] as string[]
                setHeaders(firstSheetHeaders.filter(h => h))
                setLoading(false)
                setStep('map')
            }
            workbookReader.readAsArrayBuffer(file)
        }
        base64Reader.readAsDataURL(file)
    }

    const toggleConcept = (header: string) => {
        setConceptCols(prev =>
            prev.includes(header) ? prev.filter(c => c !== header) : [...prev, header]
        )
    }

    const handleCreateMissingUnits = async () => {
        if (!missingUnits) return
        setLoading(true)
        const res = await createUnitsBatch(communityId, missingUnits)
        setLoading(false)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Unidades creadas. Ahora puedes re-intentar la carga.')
            setMissingUnits(null)
        }
    }

    const handleProcess = async () => {
        if (!unitCol || conceptCols.length === 0 || !fileData) {
            toast.error('Por favor selecciona la columna de unidad y al menos un concepto de cobro')
            return
        }

        setLoading(true)
        const result = await processFinanceExcel(period.id, communityId, fileData, {
            unitCol,
            conceptCols,
            totalCol: totalCol || undefined
        })
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
            if (result.missingUnits) {
                setMissingUnits(result.missingUnits)
            }
        } else {
            toast.success(`Carga exitosa: ${result.insertedCount} registros insertados`)

            if (result.missingUnits) {
                setMissingUnits(result.missingUnits)
            }

            if (result.validationErrors) {
                // Show validation errors in a more persistent way if needed, for now just toast
                toast.warning(`${result.validationErrors.length} discrepancias de totales detectadas.`)
                console.warn('Discrepancias:', result.validationErrors)
            }

            if (!result.missingUnits) {
                setOpen(false)
                setStep('upload')
                setFileData(null)
                onSuccess()
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <FileUp className="mr-2 h-4 w-4" /> Cargar Datos
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Importar Gastos Comunes</DialogTitle>
                    <DialogDescription>
                        Carga el Excel del administrador. El sistema detectará los conceptos de cobro automáticamente.
                    </DialogDescription>
                </DialogHeader>

                {step === 'upload' ? (
                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/30">
                        {loading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        ) : (
                            <>
                                <FileUp className="h-12 w-12 text-muted-foreground mb-4" />
                                <Label htmlFor="file-upload" className="cursor-pointer">
                                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                                        Seleccionar Archivo Excel
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileChange}
                                    />
                                </Label>
                                <p className="mt-2 text-xs text-muted-foreground">Formato aceptado: .xlsx, .xls</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>1. Columna de Identificación (Unidad/Depto/Casa)</Label>
                                <Select value={unitCol} onValueChange={setUnitCol}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona la columna..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {headers.map(h => (
                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>2. Columna de "Total" (Opcional, para validación)</Label>
                                <Select value={totalCol} onValueChange={setTotalCol}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ninguna" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No validar</SelectItem>
                                        {headers.map(h => (
                                            <SelectItem key={h} value={h} disabled={h === unitCol}>{h}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4">
                                <Label>3. Selecciona las columnas que representan Cobros (Conceptos)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[300px] overflow-auto p-2 border rounded-md">
                                    {headers.map(h => (
                                        <div key={h} className="flex items-center space-x-2 p-1">
                                            <Checkbox
                                                id={`check-${h}`}
                                                checked={conceptCols.includes(h)}
                                                onCheckedChange={() => toggleConcept(h)}
                                                disabled={h === unitCol || h === totalCol}
                                            />
                                            <label
                                                htmlFor={`check-${h}`}
                                                className={`text-xs truncate ${h === unitCol || h === totalCol ? 'opacity-50 line-through' : 'cursor-pointer'}`}
                                            >
                                                {h}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {missingUnits && (
                            <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg space-y-3">
                                <div className="flex items-center gap-2 text-yellow-800 font-medium text-sm">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>Unidades no encontradas ({missingUnits.length})</span>
                                </div>
                                <p className="text-xs text-yellow-700">
                                    Las siguientes unidades no existen en el sistema. ¿Deseas crearlas ahora para completar la carga?
                                </p>
                                <div className="bg-white/50 p-2 rounded max-h-20 overflow-auto text-[10px] font-mono">
                                    {missingUnits.join(', ')}
                                </div>
                                <Button size="sm" variant="outline" className="w-full bg-white text-yellow-800 border-yellow-300 hover:bg-yellow-100" onClick={handleCreateMissingUnits}>
                                    Crear Unidades Faltantes
                                </Button>
                            </div>
                        )}

                        <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <p>Se omitirán automáticamente los valores en cero o vacíos.</p>
                        </div>
                    </div>
                )}

                <DialogFooter className="flex justify-between items-center sm:justify-between w-full">
                    {step === 'map' && (
                        <Button variant="ghost" onClick={() => setStep('upload')} disabled={loading}>
                            Atrás
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        {step === 'map' && (
                            <Button onClick={handleProcess} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Procesar e Importar
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
