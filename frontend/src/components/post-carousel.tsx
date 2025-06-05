'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Search, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CommentDialog } from '@/components/comment-dialog';
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
  const { user } = useAuth();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        limit: '10',
        sortBy: sortOption.sortBy,
        order: sortOption.order,
        ...(searchQuery && { search: searchQuery }),
        ...(selectedTags.length > 0 && { tags: selectedTags.join(',') })
      });

      const response = await fetch(
        `http://localhost:3001/api/posts?${queryParams}`,
        { credentials: 'include' }
      );
      
      if (!response.ok) throw new Error('Failed to fetch posts');
      
      const data: PostsResponse = await response.json();
      setPosts(data.posts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/posts/tags', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch tags');
      
      const tags = await response.json();
      setAvailableTags(tags);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to like post');
      
      const updatedPost = await response.json();
      setPosts(prev => prev.map(post => 
        post.id === postId ? updatedPost : post
      ));
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  useEffect(() => {
    fetchPosts();
    fetchTags();
  }, [searchQuery, selectedTags, sortOption]);

  return (
    <div className="space-y-6">
      {/* Search, Sort, and Filter Section */}
      <div className="space-y-4">
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

      {/* Posts Carousel */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {posts.map((post) => (
            <Card 
              key={post.id}
              className="w-[350px] flex-shrink-0 bg-card/50 backdrop-blur"
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
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <p className="mb-4 line-clamp-3">{post.content}</p>
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
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1"
                  >
                    <Heart className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} />
                    <span>{post.likesCount}</span>
                  </Button>
                  <CommentDialog
                    postId={post.id}
                    commentsCount={post.commentsCount}
                    onCommentAdded={() => {
                      setPosts(prev => prev.map(p => 
                        p.id === post.id 
                          ? { ...p, commentsCount: p.commentsCount + 1 }
                          : p
                      ));
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {loading && (
        <div className="flex justify-center py-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  );
} 