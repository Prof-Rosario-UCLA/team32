'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Search, X, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CommentDialog } from '@/components/comment-dialog';
import { PostDetail } from '@/components/post-detail';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  imageUrl?: string;
  createdAt: string;
  author: {
    id: number;
    email: string;
  };
  likesCount: number;
  commentsCount: number;
  liked: boolean;
}

interface PostsResponse {
  posts: Post[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
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
  const { user } = useAuth();
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
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/tags', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data = await response.json();
      setAvailableTags(data);
    } catch (error) {
      toast.error('Failed to fetch tags');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
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
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap">
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Posts Stack */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1 px-4">
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
                  {post.imageUrl && (
                    <img 
                      src={post.imageUrl} 
                      alt={post.title}
                      className="mb-4 rounded-lg object-cover w-full h-48"
                    />
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
        </ScrollArea>
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
  );
} 