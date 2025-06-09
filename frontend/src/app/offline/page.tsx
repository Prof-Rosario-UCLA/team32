"use client"

import { Button } from "@/components/ui/button"
import { WifiOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { CachedPosts } from "@/components/cached-posts"

export default function OfflinePage() {
  const router = useRouter()

  const handleRetry = () => {
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <WifiOff className="h-6 w-6 text-muted-foreground" />
            <h1 className="text-xl font-semibold">You&apos;re Offline</h1>
          </div>
          <Button
            onClick={handleRetry}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="text-muted-foreground text-sm">
            <p>Don&apos;t worry! You can still view previously loaded content. We&apos;ll automatically reconnect when you&apos;re back online.</p>
          </div>
          
          <CachedPosts />
        </div>
      </div>
    </div>
  )
} 