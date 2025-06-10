"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Post } from "@/types/post"
import { ImagePreview } from "./image-preview"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw, WifiOff } from "lucide-react"
import { ScrollShadow } from "@/components/ui/scroll-shadow"

type LoadingState = 'loading' | 'timeout' | 'success' | 'error' | 'offline'

export function CachedPosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingState, setLoadingState] = useState<LoadingState>('loading')
  const [isFromCache, setIsFromCache] = useState(false)

  const fetchPosts = async (isRetry: boolean = false) => {
    try {
      if (isRetry) {
        setLoadingState('loading')
      }

      // If we're offline, only try to get from cache
      if (!navigator.onLine) {
        const cache = await caches.open('bruin-hot-take-api-v1')
        const request = new Request('http://localhost:3001/api/posts?sortBy=heat&order=desc&page=1&limit=10', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        const cachedResponse = await cache.match(request)
        
        if (cachedResponse) {
          const data = await cachedResponse.json()
          const postsArray = data.posts || data.data || data || []
          setPosts(Array.isArray(postsArray) ? postsArray : [])
          setIsFromCache(true)
          setLoadingState('success')
          return
        }
        
        setLoadingState('offline')
        return
      }

      // If we're online, try network request
      const response = await fetch('http://localhost:3001/api/posts?sortBy=heat&order=desc&page=1&limit=10', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })

      const isFromSWCache = response.headers.get('sw-cache-hit') === 'true'
      setIsFromCache(isFromSWCache)

      if (response.ok) {
        const data = await response.json()
        const postsArray = data.posts || data.data || data || []
        setPosts(Array.isArray(postsArray) ? postsArray : [])
        setLoadingState('success')
      } else if (response.status === 503) {
        const data = await response.json()
        if (data.offline) {
          setLoadingState('offline')
        } else {
          setLoadingState('error')
        }
      } else {
        setLoadingState('error')
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      if (!navigator.onLine) {
        setLoadingState('offline')
      } else {
        setLoadingState('timeout')
      }
    }
  }

  useEffect(() => {
    fetchPosts().catch(console.error)
  }, [])

  const handleRetry = async () => {
    fetchPosts(true)
  }

  if (loadingState === 'loading') {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              {isFromCache ? 'Loading cached posts...' : 'Fetching posts...'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loadingState === 'offline') {
    return (
      <Card className="bg-card/50 backdrop-blur border-orange-200 dark:border-orange-800">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <WifiOff className="h-8 w-8 mx-auto text-orange-500" />
            <div>
              <p className="text-lg font-medium">You&apos;re offline</p>
              <p className="text-sm text-muted-foreground">
                No cached posts available for offline viewing
              </p>
            </div>
            <div className="space-y-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loadingState === 'timeout' || loadingState === 'error') {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              {loadingState === 'timeout' ? 'Request timed out' : 'Unable to fetch posts'}
            </p>
            <div className="space-y-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (posts.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No posts available</p>
            <p className="text-sm">
              {isFromCache ? 'No cached posts found' : 'Posts will be cached as you browse'}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {isFromCache && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
              <WifiOff className="h-4 w-4" />
              Showing cached content from when you were last online
            </div>
          </CardContent>
        </Card>
      )}
      <div className="flex-1 min-h-0 pb-8">
        <ScrollShadow className="h-full px-4">
          <div className="space-y-4 p-4">
            {posts.map((post) => (
              <Card
                key={post.id}
                className="bg-card/50 backdrop-blur"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <h3 className="text-lg font-semibold line-clamp-1">{post.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {post.tags?.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 line-clamp-2">{post.content}</p>
                  {post.mediaUrl && (
                    <div className="mb-4">
                      {post.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <ImagePreview
                          src={post.mediaUrl}
                          alt={post.title}
                          previewClassName="max-h-[40vh]"
                        />
                      ) : post.mediaUrl.match(/\.(mp3|wav|m4a|ogg|aac|webm)$/i) ? (
                        <audio
                          src={post.mediaUrl}
                          controls
                          className="w-full"
                          preload="metadata"
                        />
                      ) : null}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollShadow>
      </div>
    </div>
  )
}