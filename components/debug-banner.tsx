'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

export function DebugBanner() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (error) {
            setIsVisible(true)
        }
    }, [error])

    if (!isVisible && !error) return null

    return (
        <div className="bg-yellow-100 border-b border-yellow-300 text-yellow-900 px-4 py-2 text-sm font-mono flex items-center justify-between sticky top-0 z-50">
            <div>
                <span className="font-bold mr-2">[DEBUG MODE]</span>
                {error && <span className="text-red-600 font-bold">ERROR: {error}</span>}
                {!error && <span className="text-muted-foreground">System functioning normally.</span>}
                <span className="ml-4 text-xs text-gray-500">
                    Env: {process.env.NODE_ENV} | Time: {new Date().toLocaleTimeString()}
                </span>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="hover:bg-yellow-200 px-2 rounded"
            >
                ✕
            </button>
        </div>
    )
}
