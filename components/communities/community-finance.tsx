'use client'

import { useEffect, useState } from 'react'
import { FinancePeriod } from '@/types'
import { getFinancePeriods, createFinancePeriod } from '@/lib/actions/finance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Table as TableIcon, FileUp, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { UploadFinanceDialog } from '../finance/upload-finance-dialog'

interface CommunityFinanceProps {
    communityId: string
}

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

export function CommunityFinance({ communityId }: CommunityFinanceProps) {
    const [periods, setPeriods] = useState<FinancePeriod[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newMonth, setNewMonth] = useState<string>(String(new Date().getMonth() + 1))
    const [newYear, setNewYear] = useState<string>(String(new Date().getFullYear()))

    useEffect(() => {
        loadPeriods()
    }, [communityId])

    async function loadPeriods() {
        setLoading(true)
        const result = await getFinancePeriods(communityId)
        if (result.data) setPeriods(result.data)
        setLoading(false)
    }

    async function handleCreatePeriod() {
        const res = await createFinancePeriod(communityId, parseInt(newMonth), parseInt(newYear))
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Periodo creado correctamente')
            setIsCreateOpen(false)
            loadPeriods()
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Gestión Financiera</h2>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Periodo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Apertura de Periodo</DialogTitle>
                            <DialogDescription>
                                Inicia un nuevo mes para la carga de egresos y prorrateos.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Mes</label>
                                <Select value={newMonth} onValueChange={setNewMonth}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {MONTHS.map((m, i) => (
                                            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Año</label>
                                <Select value={newYear} onValueChange={setNewYear}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[2024, 2025, 2026].map(y => (
                                            <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreatePeriod}>Abrir Periodo</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Periodos Financieros</CardTitle>
                    <CardDescription>
                        Listado de meses procesados y pendientes de conciliación.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Periodo</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Cobros Residentes</TableHead>
                                <TableHead>Egresos Edificio</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {periods.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No hay periodos financieros iniciados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                periods.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium">
                                            {MONTHS[p.month - 1]} {p.year}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.status === 'OPEN' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {p.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {p.total_billed ? `$${p.total_billed.toLocaleString('es-CL')}` : '--'}
                                        </TableCell>
                                        <TableCell>
                                            {p.total_expenses ? `$${p.total_expenses.toLocaleString('es-CL')}` : '--'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <UploadFinanceDialog
                                                period={p}
                                                communityId={communityId}
                                                onSuccess={loadPeriods}
                                            />
                                            <Button variant="ghost" size="sm">
                                                <TableIcon className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50 border-dashed">
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <CardTitle className="text-base font-normal">Sincronización de Unidades</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Asegúrate de que todas las unidades (deptos/casas) estén creadas antes de subir el Excel de cobros.
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
