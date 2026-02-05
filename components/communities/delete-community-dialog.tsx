'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertTriangle, Download, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCommunity, getCommunityExportData } from '@/lib/actions/community-management'

interface DeleteCommunityDialogProps {
    communityId: string
    communityName: string
    children?: React.ReactNode
}

export function DeleteCommunityDialog({ communityId, communityName, children }: DeleteCommunityDialogProps) {
    const [open, setOpen] = useState(false)
    const [confirmName, setConfirmName] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const router = useRouter()

    const handleExport = async () => {
        setIsExporting(true)
        const toastId = toast.loading('Exporting data...')

        try {
            const data = await getCommunityExportData(communityId)

            if ('error' in data) {
                toast.error(data.error as string, { id: toastId })
                return
            }

            // Create downloadable file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `backup-${communityName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            toast.success('Data exported successfully', { id: toastId })
        } catch (error) {
            toast.error('Failed to export data', { id: toastId })
            console.error(error)
        } finally {
            setIsExporting(false)
        }
    }

    const handleDelete = async () => {
        if (confirmName !== communityName) return

        setIsDeleting(true)
        const toastId = toast.loading('Deleting community...')

        try {
            const result = await deleteCommunity(communityId)

            if (result.error) {
                toast.error(result.error, { id: toastId })
            } else {
                toast.success('Community deleted successfully', { id: toastId })
                setOpen(false)
                router.push('/dashboard/communities')
                router.refresh()
            }
        } catch (error) {
            toast.error('An unexpected error occurred', { id: toastId })
            console.error(error)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button variant="destructive">Eliminar Comunidad</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Eliminar Comunidad
                    </DialogTitle>
                    <DialogDescription>
                        Esta acción es permanente y no se puede deshacer. Todos los datos asociados (contactos, tareas, historial) serán eliminados permanentemente.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    <div className="p-4 bg-muted/50 rounded-lg border text-sm space-y-3">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                            <Download className="h-4 w-4 text-blue-500" />
                            Copia de Seguridad Recomendada
                        </div>
                        <p className="text-muted-foreground">
                            Antes de eliminar, te recomendamos descargar una copia de seguridad de todos los datos de la comunidad.
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 border-blue-200 hover:bg-blue-50 text-blue-700"
                            onClick={handleExport}
                            disabled={isExporting || isDeleting}
                        >
                            {isExporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                            Exportar Datos de Comunidad
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirm-name">
                            Escribe <span className="font-bold select-none">{communityName}</span> para confirmar
                        </Label>
                        <Input
                            id="confirm-name"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder={communityName}
                            className="focus-visible:ring-destructive"
                            disabled={isDeleting}
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={isDeleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={confirmName !== communityName || isDeleting}
                        className="gap-2"
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Eliminar permanentemente
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
