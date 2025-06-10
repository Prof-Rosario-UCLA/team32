import { useState } from 'react';
import { Button } from "@/../components/ui/button";
import { Textarea } from "@/../components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/../contexts/auth-context";
import { API_URL } from '@/../config/api';
import { type CommentsSectionProps } from "types/comments";

export function CommentsSection({ postId, onCommentAdded }: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ content: newComment }),
      });

      if (!response.ok) throw new Error('Failed to add comment');
      
      const comment = await response.json();
      setNewComment('');
      onCommentAdded(comment);
    } catch (error) {
      toast.error('Failed to add comment: ' + error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Comments</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="h-20 resize-none"
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
    </div>
  );
} 