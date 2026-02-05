
import { getEmails, getEmail, getThreadMessages } from '@/lib/actions/communications'
import { MailList } from '@/components/communications/mail-list'
import { MailDisplay } from '@/components/communications/mail-display'
import { MailLayoutWrapper as MailLayout } from '@/components/communications/mail-layout-wrapper'
import { syncMessages } from '@/lib/actions/communications'
import { getCommunities } from '@/lib/actions/communities'
import { InboxFilter } from '@/components/communications/inbox-filter'

import { startOfDay } from 'date-fns'; // Unused, removing if not needed or keeping existing imports clean
import { getContacts } from '@/lib/actions/contacts'

type PageProps = {
    searchParams: Promise<{ id?: string, folder?: string, communityId?: string }>
}

export default async function CommunicationsPage(props: PageProps) {
    const searchParams = await props.searchParams;
    const communities = await getCommunities()
    const contacts = await getContacts()

    // Auto-sync removed from render to prevent revalidatePath error.
    // Sync verification should be triggered by user action or background process.

    // Server-side filtering
    const communityId = searchParams.communityId
    const folder = searchParams.folder || 'pending'

    const emails = await getEmails({ communityId, folder })
    console.log(`[Page] Fetched ${emails.length} emails for folder ${folder} and community ${communityId || 'All'}`)

    const filteredEmails = emails // Already filtered

    // const selectedDetails = searchParams.id ? await getEmail(searchParams.id) : null

    const selectedThreadMessages = searchParams.id
        ? await getThreadMessages((emails.find(e => e.id === searchParams.id)?.thread_id) || '')
        : []

    // Fallback if thread search failed or simple ID lookup
    // Actually, getting the thread ID from the email list is safer if the email exists there.
    // Ideally we would fetch the email first to get the thread ID, OR assumes ID is thread ID? 
    // User clicks an Email ID. We need its thread ID.

    let threadData: any[] = []
    if (searchParams.id) {
        const targetEmail = emails.find(e => e.id === searchParams.id)
        if (targetEmail && targetEmail.thread_id) {
            threadData = await getThreadMessages(targetEmail.thread_id)
        } else if (targetEmail) {
            // Fallback for single message
            threadData = [targetEmail]
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] gap-4">
            <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
                {/* Title moved to global header */}
                <InboxFilter communities={communities} />
            </div>

            <div className="hidden flex-col md:flex h-full border rounded-lg overflow-hidden">
                <MailLayout
                    list={<MailList items={filteredEmails} selectedThreadMessages={threadData} />}
                    communities={communities}
                    contacts={contacts}
                >
                    <MailDisplay
                        mail={emails.find(e => e.id === searchParams.id) || null}
                        threadMessages={threadData}
                    />
                </MailLayout>
            </div>
        </div>
    )
}
