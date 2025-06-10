"use client"

import { useEffect, useState } from "react"
import { WifiOff, Wifi } from "lucide-react"

export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false)
  const [showOnline, setShowOnline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false)
      setShowOnline(true)
      setTimeout(() => setShowOnline(false), 3000)
    }

    const handleOffline = () => {
      setIsOffline(true)
      setShowOnline(false)
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline && !showOnline) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 rounded-full px-4 py-2 shadow-lg ${
        isOffline 
          ? "bg-destructive/90 text-destructive-foreground" 
          : "bg-green-500/90 text-white"
      }`}>
        {isOffline ? (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-sm font-medium">You&apos;re offline</span>
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-sm font-medium">You&apos;re back online</span>
          </>
        )}
      </div>
    </div>
  )
} 