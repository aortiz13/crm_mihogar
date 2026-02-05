import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { createClient } from "@/lib/supabase/server"

import { getCommunities } from "@/lib/actions/communities"

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let isAdmin = false
    let userRole = null
    let debugError = null

    // Parallel data fetching
    const [communities] = await Promise.all([
        getCommunities()
    ])

    if (user) {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error("Supabase Profile Fetch Error:", error)
            debugError = error.message + ' | Details: ' + error.details + ' | Hint: ' + error.hint
        }

        userRole = profile?.role
        isAdmin = userRole === 'admin'
    }

    return (
        <SidebarProvider>
            <AppSidebar isAdmin={isAdmin} communities={communities} />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger />
                    <div className="h-4 w-px bg-border" />
                    <DashboardHeader />
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">
                    {children}
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
