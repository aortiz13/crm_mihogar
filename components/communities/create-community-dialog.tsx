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
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createCommunity } from '@/lib/actions/communities'
import { Plus } from 'lucide-react'
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'

export function CreateCommunityDialog() {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setIsLoading(true)
        const result = await createCommunity(formData)
        setIsLoading(false)

        if (result?.error) {
            // Handle error (toast, etc)
            console.error(result.error)
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Comunidad
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Agregar Comunidad</DialogTitle>
                    <DialogDescription>
                        Ingrese los detalles de la nueva comunidad o edificio.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit} id="create-community-form">
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="address" className="text-right">
                                Dirección
                            </Label>
                            <div className="col-span-3">
                                <AddressAutocomplete
                                    onSelect={(address, lat, lon) => {
                                        const form = document.getElementById('create-community-form') as HTMLFormElement
                                        if (form) {
                                            (form.elements.namedItem('address') as HTMLInputElement).value = address;
                                            (form.elements.namedItem('latitude') as HTMLInputElement).value = lat.toString();
                                            (form.elements.namedItem('longitude') as HTMLInputElement).value = lon.toString();
                                        }
                                    }}
                                />
                                <input type="hidden" name="address" required />
                                <input type="hidden" name="latitude" />
                                <input type="hidden" name="longitude" />
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="unit_count" className="text-right">
                                Unidades
                            </Label>
                            <Input
                                id="unit_count"
                                name="unit_count"
                                type="number"
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Guardando...' : 'Guardar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
