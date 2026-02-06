'use client'

import { useState } from 'react'
import { Community } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateCommunityBankData } from '@/lib/actions/communities'
import { toast } from 'sonner'

interface CommunityInfoProps {
    community: Community
}

export function CommunityInfo({ community }: CommunityInfoProps) {
    const [loading, setLoading] = useState(false)
    const [bankData, setBankData] = useState(community.bank_data || {
        bank_name: '',
        account_type: '',
        account_number: '',
        rut: '',
        email: ''
    })

    const handleSaveBankData = async () => {
        setLoading(true)
        const result = await updateCommunityBankData(community.id, bankData)
        setLoading(false)

        if (result.error) {
            toast.error('Error al guardar datos bancarios: ' + result.error)
        } else {
            toast.success('Datos bancarios actualizados correctamente')
        }
    }

    return (
        <div className="space-y-6">
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
                        <Button variant="outline">Guardar Cambios General</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Datos de Cuenta Bancaria</CardTitle>
                    <CardDescription>Información para el pago de gastos comunes.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="bank_name">Banco</Label>
                            <Input
                                id="bank_name"
                                value={bankData.bank_name || ''}
                                onChange={(e) => setBankData({ ...bankData, bank_name: e.target.value })}
                                placeholder="Ej: Banco Estado"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="account_type">Tipo de Cuenta</Label>
                            <Input
                                id="account_type"
                                value={bankData.account_type || ''}
                                onChange={(e) => setBankData({ ...bankData, account_type: e.target.value })}
                                placeholder="Ej: Corriente, Vista"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="account_number">Número de Cuenta</Label>
                            <Input
                                id="account_number"
                                value={bankData.account_number || ''}
                                onChange={(e) => setBankData({ ...bankData, account_number: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rut">RUT del Titular</Label>
                            <Input
                                id="rut"
                                value={bankData.rut || ''}
                                onChange={(e) => setBankData({ ...bankData, rut: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label htmlFor="bank_email">Email para Comprobantes</Label>
                            <Input
                                id="bank_email"
                                value={bankData.email || ''}
                                onChange={(e) => setBankData({ ...bankData, email: e.target.value })}
                                placeholder="pagos@tucomunidad.cl"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={handleSaveBankData} disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar Datos Bancarios'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
