'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Search, Loader2, MapPin } from 'lucide-react'

interface AddressAutocompleteProps {
    defaultValue?: string
    onSelect: (address: string, lat: number, lon: number) => void
    placeholder?: string
    className?: string
}

interface NominatimResult {
    display_name: string
    lat: string
    lon: string
}

export function AddressAutocomplete({
    defaultValue = '',
    onSelect,
    placeholder = "Buscar dirección...",
    className = ""
}: AddressAutocompleteProps) {
    const [query, setQuery] = useState(defaultValue)
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
    const [loading, setLoading] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.length < 4) {
                setSuggestions([])
                return
            }

            setLoading(true)
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
                )
                const data = await response.json()
                setSuggestions(data)
                setShowSuggestions(true)
            } catch (error) {
                console.error('Error fetching address suggestions:', error)
            } finally {
                setLoading(false)
            }
        }, 500)

        return () => clearTimeout(timeoutId)
    }, [query])

    const handleSelect = (result: NominatimResult) => {
        setQuery(result.display_name)
        setShowSuggestions(false)
        onSelect(
            result.display_name,
            parseFloat(result.lat),
            parseFloat(result.lon)
        )
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    className="pl-9"
                    onFocus={() => query.length >= 4 && setSuggestions.length > 0 && setShowSuggestions(true)}
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions.map((result, index) => (
                        <button
                            key={index}
                            type="button"
                            className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-start gap-2"
                            onClick={() => handleSelect(result)}
                        >
                            <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                            <span>{result.display_name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
