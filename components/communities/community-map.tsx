'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import 'leaflet/dist/leaflet.css'
import { Community } from '@/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ExternalLink } from 'lucide-react'

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
})
L.Marker.prototype.options.icon = DefaultIcon

interface CommunityMapProps {
    communities: Community[]
}

// Separate component for clustering if we use a library or just simple markers for now
export function CommunityMap({ communities }: CommunityMapProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return <div className="h-[600px] w-full bg-muted animate-pulse rounded-lg flex items-center justify-center">Cargando mapa...</div>

    const communitiesWithCoords = communities.filter(c => c.latitude && c.longitude)

    return (
        <div className="h-[600px] w-full rounded-lg overflow-hidden border shadow-sm z-0">
            <MapContainer
                center={[-33.4489, -70.6693] as any} // Default to Santiago, Chile
                zoom={11}
                scrollWheelZoom={true}
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MarkerClusterGroup
                    chunkedLoading
                    maxClusterRadius={50}
                >
                    {communitiesWithCoords.map((community) => (
                        <Marker
                            key={community.id}
                            position={[community.latitude!, community.longitude!] as any}
                        >
                            <Popup>
                                <div className="p-2 space-y-2">
                                    <h3 className="font-bold text-sm">{community.name}</h3>
                                    <p className="text-xs text-muted-foreground">{community.address}</p>
                                    <div className="pt-2">
                                        <Link href={`/dashboard/communities/${community.id}`}>
                                            <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1">
                                                Ver Ficha <ExternalLink className="h-3 w-3" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    )
}
