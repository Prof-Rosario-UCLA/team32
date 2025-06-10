import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { API_URL } from '@/../config/api';
import {CommentsListProps, Comment} from "types/comments";

export function CommentsList({ postId, newComment }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/posts/${postId}/comments`, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to fetch comments');
        const data = await response.json();
        setComments(data);
      } catch (error) {
        toast.error('Failed to load comments: ' + error);
      }
    };

    fetchComments();
  }, [postId]);

  // Add new comment to the list when it's provided
  useEffect(() => {
    if (newComment && !comments.some(comment => comment.id === newComment.id)) {
      setComments(prevComments => [newComment, ...prevComments]);
    }
  }, [newComment, comments]);

  return (
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
  );
} 