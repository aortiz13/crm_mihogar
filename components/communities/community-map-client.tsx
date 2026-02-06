'use client'

import dynamic from 'next/dynamic'
import { Community } from '@/types'

const CommunityMap = dynamic(
    () => import('./community-map').then((mod) => mod.CommunityMap),
    {
        ssr: false,
        loading: () => <div className="h-[600px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center">Cargando biblioteca de mapas...</div>
    }
)

export function CommunityMapClient({ communities }: { communities: Community[] }) {
    return <CommunityMap communities={communities} />
}
