'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Search, X, ChevronDown } from "lucide-react";
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
import { getSocket } from '@/lib/socket';

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  mediaUrl?: string;
  createdAt: string;
  author: {
    id: number;
    email: string;
  };
  likesCount: number;
  commentsCount: number;
  liked: boolean;
}
/*
interface PostsResponse {
  posts: Post[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}*/

type SortOption = {
  label: string;
  sortBy: string;
  order: 'asc' | 'desc';
};

const SORT_OPTIONS: SortOption[] = [
  { label: 'Trending', sortBy: 'heat', order: 'desc' },
  { label: 'Most Recent', sortBy: 'createdAt', order: 'desc' },
  { label: 'Oldest First', sortBy: 'createdAt', order: 'asc' },
  { label: 'Most Liked', sortBy: 'likesCount', order: 'desc' },
  { label: 'Most Comments', sortBy: 'commentsCount', order: 'desc' },
];

interface PostCarouselProps {
  initialPosts?: Post[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  showSortOptions?: boolean;
  disableScrollShadows?: boolean;
}

export function PostCarousel({
  initialPosts,
  onLoadMore,
  hasMore: propHasMore,
  isLoading: propIsLoading,
  showSortOptions = true,
  disableScrollShadows = false
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
  const observer = useRef<IntersectionObserver | null>(null);

  // Update posts when initialPosts changes
  useEffect(() => {
    if (initialPosts) {
      setPosts(initialPosts);
    }
  }, [initialPosts]);

  // Update loading state when prop changes
  useEffect(() => {
    if (propIsLoading !== undefined) {
      setLoading(propIsLoading);
    }
  }, [propIsLoading]);

  // Update hasMore state when prop changes
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
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to like post');
      }

      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, liked: !p.liked, likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1 }
          : p
      ));

      if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? {
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
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, commentsCount: p.commentsCount + 1 }
        : p
    ));

    if (selectedPost?.id === postId) {
      setSelectedPost(prev => prev ? {
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

      const response = await fetch(`http://localhost:3001/api/posts?${queryParams}`, {
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
      console.log("Failed to fetch posts: " + error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/posts/tags', {
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
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Only fetch posts if we're not using initialPosts
  useEffect(() => {
    if (!initialPosts) {
      setPage(1);
      setHasMore(true);
      fetchPosts(1, true);
    }
  }, [searchQuery, selectedTags, sortOption, initialPosts]);

  // Only fetch more posts if we're not using initialPosts
  useEffect(() => {
    if (!initialPosts && page > 1) {
      fetchPosts(page);
    }
  }, [page, initialPosts]);

  // Only fetch tags if we're showing sort options
  useEffect(() => {
    if (showSortOptions) {
      fetchTags();
    }
  }, [showSortOptions]);

  useEffect(() => {
    const socket = getSocket();

    // Cleanup on unmount
    return () => {
      socket.off('new-post');
    };
  }, []);

  const handleRefresh = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/posts', {
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

  return (
    <div className="relative h-full">
      <div className="h-full flex flex-col">
        {!initialPosts && <NewPostNotification onRefresh={handleRefresh} />}

        {/* Search, Sort, and Filter Section */}
        {showSortOptions && (
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

            {disableScrollShadows ? (
              <div className="flex gap-2 pb-2 overflow-x-auto">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer flex-shrink-0"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {selectedTags.includes(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            ) : (
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
            )}
          </div>
        )}

        {/* Posts Stack */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {disableScrollShadows ? (
            <div className="h-full px-4 overflow-y-auto">
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
                ))}
                {loading && (
                  <div className="flex justify-center py-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <ScrollShadow className="h-full px-4">
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
                ))}
                {loading && (
                  <div className="flex justify-center py-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                )}
              </div>
            </ScrollShadow>
          )}
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
      </div>
    </div>
  );
} 