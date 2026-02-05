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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, UserPlus } from 'lucide-react'
import { inviteUser } from '@/lib/actions/admin'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Community {
    id: string
    name: string
}

interface InviteUserDialogProps {
    communities: Community[]
}

export function InviteUserDialog({ communities }: InviteUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [role, setRole] = useState('operator')

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        const result = await inviteUser(formData)
        setLoading(false)

        if (result?.error) {
            alert(result.error) // Simple alert for now
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invitar Usuario
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Invitar Usuario</DialogTitle>
                    <DialogDescription>
                        Envía una invitación por correo electrónico.
                    </DialogDescription>
                </DialogHeader>
                <form action={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input id="email" name="email" type="email" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right">
                                Rol
                            </Label>
                            <Select name="role" defaultValue="operator" onValueChange={setRole}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Selecciona un rol" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                    <SelectItem value="operator">Operador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {role === 'operator' && (
                            <div className="grid grid-cols-4 gap-4">
                                <Label className="text-right mt-2">Comunidades</Label>
                                <div className="col-span-3 border rounded-md p-3">
                                    <p className="text-xs text-muted-foreground mb-2">Selecciona las comunidades permitidas:</p>
                                    <ScrollArea className="h-[150px]">
                                        <div className="space-y-2">
                                            {communities.map((community) => (
                                                <div key={community.id} className="flex items-center space-x-2">
                                                    <Checkbox id={community.id} name="communities" value={community.id} />
                                                    <Label htmlFor={community.id} className="font-normal cursor-pointer">
                                                        {community.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar Invitación'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
