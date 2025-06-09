'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Search, X, ChevronDown} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollShadow } from './ui/scroll-shadow';
import { toast } from "sonner";
import { CommentDialog } from '@/components/comment-dialog';
import { PostDetail } from '@/components/post-detail';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImagePreview } from "@/components/image-preview";
import { NewPostNotification } from '@/components/new-post-notification';
import { initializeWebSocket, on, getSocket } from '@/lib/socket';
import { API_URL } from '@/config/api';
import type { Post } from '../types/post';
import { CreatePostModal } from '@/components/create-post-modal';

interface WebSocketMessage {
  type?: string;
  data?: Post;
  timestamp?: number;
  id?: string;
  title?: string;
  content?: string;
  tags?: string[];
  mediaUrl?: string | null;
  author?: {
    id: number;
    email: string;
  };
  authorId?: number;
  commentsCount?: number;
  createdAt?: string;
  isPublished?: boolean;
  liked?: boolean;
  likesCount?: number;
  updatedAt?: string;
}

type SortOption = {
  label: string;
  sortBy: string;
  order: 'asc' | 'desc';
};

const SORT_OPTIONS: SortOption[] = [
  { label: 'Most Recent', sortBy: 'createdAt', order: 'desc' },
  { label: 'Oldest First', sortBy: 'createdAt', order: 'asc' },
  { label: 'Most Liked', sortBy: 'likesCount', order: 'desc' },
  { label: 'Most Comments', sortBy: 'commentsCount', order: 'desc' },
];

export function PostCarousel() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
  };

  const handlePostClose = () => {
    setSelectedPost(null);
  };

  const handlePostLike = async (postId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      setPosts((prev: Post[]) => prev.map(p => 
        p.id === postId
          ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      ));

      if (selectedPost?.id === postId) {
        setSelectedPost((prev: Post | null) => prev ? {
          ...prev,
          liked: !prev.liked,
          likesCount: prev.liked ? prev.likesCount - 1 : prev.likesCount + 1
        } : null);
      }
    } catch (error) {
      toast.error("Failed to like post");
      console.log("Failed to like post: " + error);
    }
  };

  const handleCommentAdded = (postId: string) => {
    setPosts((prev: Post[]) => prev.map(p => 
      p.id === postId 
        ? { ...p, commentsCount: p.commentsCount + 1 }
        : p
    ));

    if (selectedPost?.id === postId) {
      setSelectedPost((prev: Post | null) => prev ? {
        ...prev,
        commentsCount: prev.commentsCount + 1
      } : null);
    }
  };

  const fetchPosts = async (pageNum: number, isNewSearch: boolean = false) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (selectedTags.length > 0) queryParams.append('tags', selectedTags.join(','));
      if (sortOption.sortBy) queryParams.append('sortBy', sortOption.sortBy);
      if (sortOption.order) queryParams.append('order', sortOption.order);
      queryParams.append('page', pageNum.toString());
      queryParams.append('limit', '10');

      const response = await fetch(`${API_URL}/api/posts?${queryParams}`, {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      
      if (isNewSearch) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      
      setHasMore(data.posts.length === 10);
    } catch (error) {
      toast.error('Failed to fetch posts');
      console.log("Failed to fetch posts: " +  error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/tags`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data = await response.json();
      setAvailableTags(data);
    } catch (error) {
      toast.error('Failed to fetch tags');
      console.log("Failed to fetch tags: " + error);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev: string[]) => 
      prev.includes(tag)
        ? prev.filter((t: string) => t !== tag)
        : [...prev, tag]
    );
  };

  // Reset and fetch new posts when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchPosts(1, true);
  }, [searchQuery, selectedTags, sortOption]);

  // Fetch more posts when page changes
  useEffect(() => {
    if (page > 1) {
      fetchPosts(page);
    }
  }, [page]);

  // Initial fetch
  useEffect(() => {
    fetchTags();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    initializeWebSocket();
    
    // Subscribe to WebSocket events
    on<WebSocketMessage>('new_post', (message) => {
      console.log('New post received:', message);
      // Handle both direct post objects and wrapped messages
      const post = message.type === 'new_post' && message.data ? message.data : message;
      if (post.id && Array.isArray(post.tags)) {
        // Prefix mediaUrl with API_URL if it exists and doesn't already have a full URL
        const processedPost = {
          id: post.id,
          title: post.title || '',
          content: post.content || '',
          tags: post.tags,
          mediaUrl: post.mediaUrl && !post.mediaUrl.startsWith('http') 
            ? `${API_URL}/api${post.mediaUrl}`
            : post.mediaUrl || undefined,
          author: post.author || { id: 0, email: '' },
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          liked: post.liked ?? false,
          createdAt: post.createdAt || new Date().toISOString()
        } as Post;
        setPosts(prevPosts => {
          // Check if post already exists
          if (prevPosts.some(existingPost => existingPost.id === processedPost.id)) {
            return prevPosts;
          }
          return [processedPost, ...prevPosts];
        });
      } else {
        console.error('Invalid post data received:', message);
      }
    });

    on<WebSocketMessage>('post_updated', (message) => {
      console.log('Post updated:', message);
      // Handle both direct post objects and wrapped messages
      const post = message.type === 'post_updated' && message.data ? message.data : message;
      if (post.id && Array.isArray(post.tags)) {
        // Prefix mediaUrl with API_URL if it exists and doesn't already have a full URL
        const processedPost = {
          id: post.id,
          title: post.title || '',
          content: post.content || '',
          tags: post.tags,
          mediaUrl: post.mediaUrl && !post.mediaUrl.startsWith('http') 
            ? `${API_URL}/api${post.mediaUrl}`
            : post.mediaUrl || undefined,
          author: post.author || { id: 0, email: '' },
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          liked: post.liked ?? false,
          createdAt: post.createdAt || new Date().toISOString()
        } as Post;
        setPosts(prevPosts => 
          prevPosts.map(existingPost => 
            existingPost.id === processedPost.id ? processedPost : existingPost
          )
        );
      } else {
        console.error('Invalid post data received:', message);
      }
    });

    on<WebSocketMessage>('post_deleted', (message) => {
      console.log('Post deleted:', message);
      // Handle both direct post objects and wrapped messages
      const post = message.type === 'post_deleted' && message.data ? message.data : message;
      if (post.id) {
        setPosts(prevPosts => 
          prevPosts.filter(existingPost => existingPost.id !== post.id)
        );
      } else {
        console.error('Invalid post data received:', message);
      }
    });

    on<WebSocketMessage[]>('recent_messages', (messages) => {
      console.log('Recent messages received:', messages);
      if (Array.isArray(messages)) {
        // Extract and validate post data from messages
        const validPosts = messages
          .map(msg => msg.type === 'new_post' && msg.data ? msg.data : msg)
          .filter((post): post is Post => 
            post.id !== undefined && 
            Array.isArray(post.tags)
          )
          .map(post => ({
            id: post.id,
            title: post.title || '',
            content: post.content || '',
            tags: post.tags,
            mediaUrl: post.mediaUrl && !post.mediaUrl.startsWith('http') 
              ? `${API_URL}/api${post.mediaUrl}`
              : post.mediaUrl || undefined,
            author: post.author || { id: 0, email: '' },
            likesCount: post.likesCount || 0,
            commentsCount: post.commentsCount || 0,
            liked: post.liked ?? false,
            createdAt: post.createdAt || new Date().toISOString()
          } as Post));
        
        setPosts(prevPosts => {
          // Filter out posts that already exist
          const uniqueNewPosts = validPosts.filter(
            newPost => !prevPosts.some(existingPost => existingPost.id === newPost.id)
          );
          // Only add new posts if there are any
          return uniqueNewPosts.length > 0 ? [...uniqueNewPosts, ...prevPosts] : prevPosts;
        });
      }
    });

    // Cleanup on unmount
    return () => {
      const socket = getSocket();
      socket.disconnect();
    };
  }, []);

  const handleRefresh = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data.posts || []);
      setPage(1);
      setHasMore(true);
    } catch (error) {
      console.error('Error refreshing posts:', error);
      toast.error('Failed to refresh posts');
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => {
      // Check if post already exists
      if (prevPosts.some(existingPost => existingPost.id === newPost.id)) {
        return prevPosts;
      }
      return [newPost, ...prevPosts];
    });
  };

  return (
    <div className="relative">
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <NewPostNotification onRefresh={handleRefresh} currentPosts={posts} />

        {/* Search, Sort, and Filter Section */}
        <div className="flex-none space-y-4 p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-[180px] justify-between">
                  {sortOption.label}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={`${option.sortBy}-${option.order}`}
                    onClick={() => setSortOption(option)}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => setShowCreatePost(true)}>
              Create Post
            </Button>
          </div>
          
          <ScrollShadow>
            <div className="flex gap-2 pb-2">
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </ScrollShadow>
        </div>

        {/* Posts Stack */}
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollShadow className="flex-1 px-4 relative">
              <div className="space-y-4 pb-4">
                {posts.map((post, index) => (
                  <Card 
                    key={post.id}
                    ref={index === posts.length - 1 ? lastPostRef : null}
                    className="bg-card/50 backdrop-blur cursor-pointer hover:bg-card/60 transition-colors"
                    onClick={() => handlePostClick(post)}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <h3 className="text-lg font-semibold line-clamp-1">{post.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {post.tags && Array.isArray(post.tags) && post.tags.map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTag(tag);
                            }}
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
                      <div className="flex items-center gap-4">
                        <Button
                          variant={post.liked ? "default" : "ghost"}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePostLike(post.id);
                          }}
                          className="flex items-center gap-1"
                        >
                          <Heart className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} />
                          <span>{post.likesCount}</span>
                        </Button>
                        <CommentDialog
                          postId={post.id}
                          commentsCount={post.commentsCount}
                          onCommentAdded={() => handleCommentAdded(post.id)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {loading && (
                  <div className="flex justify-center py-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
          </ScrollShadow>
        </div>
        {/* Post Detail Modal */}
        {selectedPost && (
          <PostDetail
            post={selectedPost}
            onClose={handlePostClose}
            onLike={handlePostLike}
            onCommentAdded={() => handleCommentAdded(selectedPost.id)}
          />
        )}
        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={showCreatePost}
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      </div>
    </div>
  );
}