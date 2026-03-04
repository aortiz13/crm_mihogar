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
            try {
                await syncMessages()
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
