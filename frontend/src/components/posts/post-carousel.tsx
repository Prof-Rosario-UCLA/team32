'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Flame, Search, ChevronDown, X } from "lucide-react";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { ScrollShadow } from '../../components/ui/scroll-shadow';
import { toast } from "sonner";
import { CommentDialog } from '../../components/comments/comment-dialog';
import { PostDetail } from '../../components/posts/post-detail';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { ImagePreview } from "../../components/media/image-preview";
import { initializeWebSocket, on, getSocket } from '../../lib/socket';
import { API_URL } from '../../config/api';
import type { Post, SortOption, PostCarouselProps } from '../../types/post';
import { CreatePostModal } from '../../components/modals/create-post-modal';
import { NewPostNotification } from '../../components/notifications/new-post-notification';
import { WebSocketMessage } from '../../types/websocket';
import {SORT_OPTIONS} from '../../lib/const';
import { withStopEvent } from '../../utils/stop-event';

export function PostCarousel({
  initialPosts,
  onLoadMore,
  hasMore: propHasMore,
  isLoading: propIsLoading,
  showSortOptions = true,
  containerMode = 'fullscreen'
}: PostCarouselProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [loading, setLoading] = useState(propIsLoading || false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>(SORT_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(propHasMore ?? true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);


  const observer = useRef<IntersectionObserver | null>(null);

  // this is how we update likes
  useEffect(() => {
    if (initialPosts) {
      const postsWithLikeState = initialPosts.map(post => ({
        ...post,
        liked: Boolean(post.liked) 
      }));
      setPosts(postsWithLikeState);
    }
  }, [initialPosts]);

  useEffect(() => {
    if (propIsLoading !== undefined) {
      setLoading(propIsLoading);
    }
  }, [propIsLoading]);

  useEffect(() => {
    if (propHasMore !== undefined) {
      setHasMore(propHasMore);
    }
  }, [propHasMore]);

  const lastPostRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        if (onLoadMore) {
          onLoadMore();
        } else {
          setPage(prevPage => prevPage + 1);
        }
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, onLoadMore]);

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

      const updatedPost = await response.json();

      setPosts(prev => prev.map(p =>
        p.id === postId
          ? {
            ...p,
            liked: updatedPost.liked,
            likesCount: updatedPost.likesCount
          }
          : p
      ));

      // update selected post if it's the one being liked
      if (selectedPost?.id === postId) {
        setSelectedPost((prev: Post | null) => prev ? {
          ...prev,
          liked: updatedPost.liked,
          likesCount: updatedPost.likesCount
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

      // ensure each post has the liked property from the backend
      const postsWithLikeState = data.posts.map((post: Post) => ({
        ...post,
        liked: post.liked ?? false // use the liked state from backend : default to false if not present
      }));

      if (isNewSearch) {
        setPosts(postsWithLikeState);
      } else {
        setPosts(prev => [...prev, ...postsWithLikeState]);
      }

      setHasMore(data.posts.length === 10);
    } catch (error) {
      toast.error('Failed to fetch posts');
      console.log("Failed to fetch posts: " + error);
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

  useEffect(() => {
    if (!initialPosts) {
      setPage(1);
      setHasMore(true);
      fetchPosts(1, true);
    }
  }, [searchQuery, selectedTags, sortOption, initialPosts]);

  useEffect(() => {
    if (!initialPosts && page > 1) {
      fetchPosts(page);
    }
  }, [page, initialPosts]);

  useEffect(() => {
    if (showSortOptions) {
      fetchTags();
    }
  }, [showSortOptions]);

  useEffect(() => {
    initializeWebSocket();
    
    // subscribe to WebSocket events
    on<WebSocketMessage>('new_post', (message) => {
      console.log('New post received:', message);
      const post = message.type === 'new_post' && message.data ? message.data : message;
      if (post.id && Array.isArray(post.tags)) {
        const processedPost = {
          id: post.id,
          title: post.title || '',
          content: post.content || '',
          tags: post.tags,
          mediaUrl: post.mediaUrl && !post.mediaUrl.startsWith('http') 
            ? `${API_URL}/api/${post.mediaUrl}`
            : post.mediaUrl || undefined,
          author: post.author || { id: 0, email: '' },
          likesCount: post.likesCount || 0,
          commentsCount: post.commentsCount || 0,
          liked: post.liked ?? false,
          createdAt: post.createdAt || new Date().toISOString()
        } as Post;
        setPosts(prevPosts => {
          // this is how we ensure we DO NOT add duplicates
          if (prevPosts.some(existingPost => existingPost.id === processedPost.id)) {
            return prevPosts;
          }
          return [processedPost, ...prevPosts];
        });
      } else {
        console.error('Invalid post data received:', message);
      }
    });

    /* //maybe for the future...
    on<WebSocketMessage>('post_updated', (message) => {
      console.log('Post updated:', message);
      const post = message.type === 'post_updated' && message.data ? message.data : message;
      if (post.id && Array.isArray(post.tags)) {
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
    });*/

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

    // the socket dies every minute or so :P
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

      const postsWithLikeState = data.posts.map((post: Post) => ({
        ...post,
        liked: post.liked ?? false 
      }));

      setPosts(postsWithLikeState);
      setPage(1);
      setHasMore(true);
    } catch (error) {
      console.error('Error refreshing posts:', error);
      toast.error('Failed to refresh posts');
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prevPosts => {
      if (prevPosts.some(existingPost => existingPost.id === newPost.id)) {
        return prevPosts;
      }
      return [newPost, ...prevPosts];
    });
  };

  return (
    <div className={containerMode === 'fullscreen' 
      ? "absolute inset-0 top-16 flex flex-col" 
      : "flex flex-col h-full"
    }>
      <div className={containerMode === 'fullscreen' 
        ? "flex flex-col h-full max-w-4xl mx-auto w-full"
        : "flex flex-col h-full w-full"
      }>
         {!initialPosts && containerMode === 'fullscreen' && (
          <NewPostNotification onRefresh={handleRefresh} currentPosts={posts} />
        )}

        {/* Search, Sort, and Filter Section */}
        {showSortOptions && (
          <div className="flex-none space-y-4 p-4 border-b">
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
                      className={option.sortBy === 'heat' ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/50' : ''}
                    >
                      <div className="flex items-center gap-2">
                        {option.sortBy === 'heat' && (
                          <Flame className="h-4 w-4 text-orange-500" />
                        )}
                        {option.label}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <ScrollShadow>
              <div className="flex gap-2 pb-2 overflow-x-auto">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className={`
                      cursor-pointer flex-shrink-0 whitespace-nowrap
                      text-xs xs:text-sm 
                      px-2 xs:px-3 py-1 xs:py-1.5
                      max-w-[100px] xs:max-w-[140px] sm:max-w-[180px] md:max-w-none
                      ${tag.length > 15 ? 'text-[10px] xs:text-xs' : ''}
                    `}
                    onClick={() => toggleTag(tag)}
                    title={tag} 
                  >
                    <span className="truncate">
                      {tag.length > 12 ? `${tag.slice(0, 12)}...` : tag}
                    </span>
                    {selectedTags.includes(tag) && (
                      <X className="ml-1 h-3 w-3 flex-shrink-0" />
                    )}
                  </Badge>
                ))}
              </div>
            </ScrollShadow>
          </div>
        )}

        {/* posts stack */}
        <div className="flex-1 overflow-hidden">
          <ScrollShadow className="h-full px-4">
            <div className="space-y-4 p-4">
              {posts.length === 0 && !loading ? (
                <Card className="bg-card/50 backdrop-blur">
                  <CardContent className="p-6">
                    <div className="text-center text-muted-foreground">
                      <p className="text-lg font-medium">No posts to display</p>
                      <p className="text-sm">Be the first to share your take!</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                posts.map((post, index) => (
                  <Card
                    key={post.id}
                    ref={index === posts.length - 1 ? lastPostRef : null}
                    className="bg-card/50 backdrop-blur cursor-pointer hover:bg-card/60 transition-colors"
                    onClick={withStopEvent(() => handlePostClick(post))}
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
                          className={`flex items-center gap-1 ${post.liked ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                        >
                          <Flame className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} />
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
                ))
              )}
              {loading && (
                <div className="flex justify-center py-4">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              )}
            </div>
          </ScrollShadow>
        </div>

        {/* post details */}
        {containerMode === 'fullscreen' && (
          <>
            {selectedPost && (
              <PostDetail
                post={selectedPost}
                onClose={handlePostClose}
                onLike={handlePostLike}
                onCommentAdded={() => handleCommentAdded(selectedPost.id)}
              />
            )}
            <CreatePostModal
              isOpen={showCreatePost}
              onClose={() => setShowCreatePost(false)}
              onPostCreated={handlePostCreated}
            />
          </>
        )}
      </div>
    </div>
  );
}
