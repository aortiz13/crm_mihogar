'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

import { syncMessages } from '@/lib/actions/communications'

interface InboxFilterProps {
    communities: { id: string, name: string }[]
}

export function InboxFilter({ communities }: InboxFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentCommunityId = searchParams.get('communityId') || ''
    const [isLoading, setIsLoading] = useState(false)

    // Auto-refresh every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.refresh()
        }, 5000)

        return () => clearInterval(interval)
    }, [router])

    const handleFilter = async (communityId: string) => {
        setIsLoading(true)
        const params = new URLSearchParams(searchParams.toString())
        if (communityId) {
            params.set('communityId', communityId)
            // Trigger Sync for the selected community
            // We don't await this blocking navigation completely, but it provides better UX if we do partial wait
            try {
                // await syncMessages(communityId) // disabling manual sync on filter change to rely on auto-refresh or bg sync to avoid delay
                // Actually user might expect fresh data on filter change. Let's keep it but maybe non-blocking?
                // The prompt asked for auto-refresh. Let's stick to that.
                // Keeping syncMessages but knowing it adds delay.
                await syncMessages(communityId)
            } catch (error) {
                console.error("Sync failed", error)
            }
        } else {
            params.delete('communityId')
        }
        router.push(`/dashboard/communications?${params.toString()}`)
        setIsLoading(false)
    }

    return (
        <div className="flex gap-2 items-center">
            <select
                value={currentCommunityId}
                className="h-9 w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onChange={(e) => handleFilter(e.target.value)}
                disabled={isLoading}
            >
                <option value="">Todas las comunidades</option>
                {communities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
            {isLoading && <span className="text-xs text-muted-foreground animate-pulse">Sincronizando...</span>}
        </div>
    )
}
