import { getContacts } from '@/lib/actions/contacts'
import { getCommunities } from '@/lib/actions/communities' // Import this
import { ContactTable } from '@/components/contacts/contact-table'


export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
    const contacts = await getContacts()
    const communities = await getCommunities() // Fetch communities

    return (
        <div className="flex h-full flex-col space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                {/* Title moved to header */}
            </div>
            <ContactTable data={contacts} communities={communities} />
        </div>
    )
}
