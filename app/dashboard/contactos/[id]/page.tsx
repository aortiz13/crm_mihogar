import { getContact, getContactNotes } from '@/lib/actions/contacts'
import { getContactUnits } from '@/lib/actions/units'
import { getCommunities } from '@/lib/actions/communities'
import { getContactActivities } from '@/lib/actions/activities'
import { ContactDetail } from '@/components/contacts/contact-detail'
import { Storyline } from '@/components/activities/storyline'
import { ContactUnits } from '@/components/contacts/contact-units'
import { AddEventDialog } from '@/components/activities/add-event-dialog'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function ContactDetailPage(props: PageProps) {
    const params = await props.params;
    const [contact, notes, communities, activities, unitRelations] = await Promise.all([
        getContact(params.id),
        getContactNotes(params.id),
        getCommunities(),
        getContactActivities(params.id),
        getContactUnits(params.id)
    ])

    if (!contact) {
        notFound()
    }

    return (
        <div className="flex h-full flex-col space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/contactos">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">Detalles del Contacto</h2>
            </div>

            <Tabs defaultValue="info" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="info">Perfil</TabsTrigger>
                    <TabsTrigger value="properties">Propiedades</TabsTrigger>
                    <TabsTrigger value="storyline">Storyline</TabsTrigger>
                </TabsList>
                <TabsContent value="info">
                    <ContactDetail
                        contact={contact}
                        notes={notes}
                        communities={communities}
                    />
                </TabsContent>
                <TabsContent value="properties">
                    <ContactUnits relations={unitRelations.data || []} />
                </TabsContent>
                <TabsContent value="storyline" className="space-y-4">
                    <div className="flex justify-end">
                        <AddEventDialog communityId={contact.community_id || ''} contactId={contact.id} />
                    </div>
                    <Storyline activities={activities} title="Historial del Contacto" />
                </TabsContent>
            </Tabs>
        </div>
    )
}
