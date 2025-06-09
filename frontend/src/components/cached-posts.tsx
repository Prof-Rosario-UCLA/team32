"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Post } from "@/types/post"
import { ImagePreview } from "./image-preview"

export function CachedPosts() {
  const [posts, setPosts] = useState<Post[]>([])

  useEffect(() => {
    const fetchCachedPosts = async () => {
      try {
        const response = await fetch('/api/posts')
        if (response.ok) {
          const data = await response.json()
          setPosts(data.posts)
        }
      } catch (error) {
        console.error('Error fetching cached posts:', error)
      }
    }

    fetchCachedPosts()
  }, [])

  if (posts.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No cached posts available</p>
            <p className="text-sm">Posts will be cached as you browse</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
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
              {post.tags.map(tag => (
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
  )
} 