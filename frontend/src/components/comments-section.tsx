import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: number;
    anonymousName: string;
  };
}

interface CommentsSectionProps {
  postId: string;
  onCommentAdded: () => void;
}

export function CommentsSection({ postId, onCommentAdded }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setComments(data);
    } catch (error) {
      toast.error('Failed to load comments: ' + error);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error('Failed to add comment');
      
      const comment = await response.json();
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      onCommentAdded();
    } catch (error) {
      toast.error('Failed to add comment: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Comments ({comments.length})</h3>
        
        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[50px]"
          />
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || !newComment.trim()}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>

        {/* Comments List */}
        <ScrollShadow className="h-[300px]">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{comment.author.anonymousName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                </div>
              ))}
              {comments.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </ScrollArea>
        </ScrollShadow>
      </div>
    </div>
  );
} 