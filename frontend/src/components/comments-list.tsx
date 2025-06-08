import { useState, useEffect } from 'react';
import { toast } from "sonner";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: number;
    anonymousName: string;
  };
}

interface CommentsListProps {
  postId: string;
}

export function CommentsList({ postId }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const fetchComments = async () => {
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
    };

    fetchComments();
  }, [postId]);

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