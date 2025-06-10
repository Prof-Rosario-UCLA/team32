import { useState } from 'react';
import { useAuth } from '@/../contexts/auth-context';
import { Button } from '@/../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/../components/ui/dialog';
import { Textarea } from '@/../components/ui/textarea';
import { toast } from 'sonner';
import { MessageSquare, Send } from 'lucide-react';
import { ScrollArea } from '@/../components/ui/scroll-area';
import { API_URL } from '@/../config/api';
import { CommentDialogProps, Comment } from '@/../types/comments';

export function CommentDialog({ postId, commentsCount, onCommentAdded }: CommentDialogProps) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchComments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to fetch comments');
      
      const data = await response.json();
      setComments(data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to fetch comments');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to comment');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to add comment');

      const comment = await response.json();
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      onCommentAdded();
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
    fetchComments();
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchComments();
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleTriggerClick}
        >
          <MessageSquare className="h-4 w-4" />
          <span>{commentsCount}</span>
        </Button>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="h-20 resize-none"
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loading || !user}>
                {loading ? 'Posting...' : 'Post Comment'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          <ScrollArea className="h-[300px] pr-4">
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
                <p className="text-center text-sm text-muted-foreground">
                  No comments yet. Be the first to comment!
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
} 