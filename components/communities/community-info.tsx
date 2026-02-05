'use client'

import { Community } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface CommunityInfoProps {
    community: Community
}

export function CommunityInfo({ community }: CommunityInfoProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Información General</CardTitle>
                <CardDescription>Detalles de la comunidad y contacto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nombre de la Comunidad</Label>
                        <Input id="name" defaultValue={community.name} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input id="address" defaultValue={community.address || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="units">Unidades Totales</Label>
                        <Input id="units" type="number" defaultValue={community.unit_count || ''} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="onedrive">ID Carpeta OneDrive</Label>
                        <Input id="onedrive" defaultValue={community.onedrive_folder_id || ''} placeholder="Opcional" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Información de Contacto</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="Email de contacto" defaultValue={community.contact_info?.email || ''} />
                        <Input placeholder="Teléfono" defaultValue={community.contact_info?.phone || ''} />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button>Guardar Cambios</Button>
                </div>
            </CardContent>
        </Card>
    )
}
