'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, Search, Loader2, Check, ChevronsUpDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { getContacts } from '@/lib/actions/contacts'
import { linkContactToUnit } from '@/lib/actions/units'
import { Contact } from '@/types'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface AssignContactModalProps {
    unitId: number
    communityId: string
}

const ROLES = [
    { label: 'Propietario', value: 'OWNER' },
    { label: 'Arrendatario', value: 'TENANT' },
    { label: 'Residente', value: 'RESIDENT' },
    { label: 'Corredor', value: 'BROKER' },
    { label: 'Administrador', value: 'ADMIN' },
]

export function AssignContactModal({ unitId, communityId }: AssignContactModalProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [contacts, setContacts] = useState<Contact[]>([])
    const [searchOpen, setSearchOpen] = useState(false)

    const [selectedContactId, setSelectedContactId] = useState('')
    const [role, setRole] = useState('TENANT')
    const [isPrimaryPayer, setIsPrimaryPayer] = useState(false)

    useEffect(() => {
        if (open) {
            loadContacts()
        }
    }, [open])

    async function loadContacts() {
        const data = await getContacts()
        setContacts(data)
    }

    const handleAssign = async () => {
        if (!selectedContactId) {
            toast.error('Selecciona un contacto')
            return
        }

        setLoading(true)
        const res = await linkContactToUnit({
            unit_id: unitId,
            contact_id: selectedContactId,
            role,
            is_primary_payer: isPrimaryPayer
        })
        setLoading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Contacto asignado correctamente')
            setOpen(false)
            reset()
            router.refresh()
        }
    }

    const reset = () => {
        setSelectedContactId('')
        setRole('TENANT')
        setIsPrimaryPayer(false)
    }

    const selectedContact = contacts.find(c => c.id === selectedContactId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" /> Asignar Contacto
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Asignar Contacto a Unidad</DialogTitle>
                    <DialogDescription>
                        Vincula una persona a esta propiedad definiendo su responsabilidad.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label>Contacto</Label>
                        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={searchOpen}
                                    className="w-full justify-between"
                                >
                                    {selectedContact ? selectedContact.full_name : "Buscar contacto..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[375px] p-0">
                                <Command>
                                    <CommandInput placeholder="Nombre o email..." />
                                    <CommandEmpty>No se encontraron contactos.</CommandEmpty>
                                    <CommandList>
                                        <CommandGroup>
                                            {contacts.map((contact) => (
                                                <CommandItem
                                                    key={contact.id}
                                                    value={contact.full_name}
                                                    onSelect={() => {
                                                        setSelectedContactId(contact.id)
                                                        setSearchOpen(false)
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedContactId === contact.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{contact.full_name}</span>
                                                        <span className="text-[10px] text-muted-foreground">{contact.email}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Rol en la Propiedad</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROLES.map(r => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="primary_payer"
                            checked={isPrimaryPayer}
                            onCheckedChange={(val) => setIsPrimaryPayer(!!val)}
                        />
                        <Label htmlFor="primary_payer" className="text-sm font-normal">
                            ¿Es el pagador principal de gastos comunes?
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAssign} disabled={loading || !selectedContactId}>
                        {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                        Vincular Contacto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
