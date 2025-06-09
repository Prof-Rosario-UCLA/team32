"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center gap-2 rounded-full bg-destructive/90 px-4 py-2 text-destructive-foreground shadow-lg">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">You&apos;re offline</span>
      </div>
    </div>
  )
} 