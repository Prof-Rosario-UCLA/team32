import { Dialog, DialogContent, DialogTitle } from "@/../components/ui/dialog";
import { Button } from "@/../components/ui/button";
import { Flame } from "lucide-react";
import { Badge } from "@/../components/ui/badge";
import { ScrollShadow } from "@/../components/ui/scroll-shadow"
import { CommentDialog } from '@/../components/comments/comment-dialog';
import { CommentsSection } from '@/../components/comments/comments-section';
import { CommentsList } from '@/../components/comments/comments-list';
import { ImagePreview } from "@/../components/media/image-preview";
import { useState } from 'react';
import { PostDetailProps } from '@/../types/post';
import { Comment } from '@/../types/comments';

export function PostDetail({ post, onClose, onLike, onCommentAdded }: PostDetailProps) {
  const [newComment, setNewComment] = useState<Comment | undefined>();

  const handleCommentAdded = (comment: Comment) => {
    setNewComment(comment);
    onCommentAdded();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="max-w-4xl h-[98vh] p-0 flex flex-col">
        <div className="flex-none px-6 py-3 border-b">
          <h2 className="text-xl font-semibold mb-1">{post.title}</h2>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm text-muted-foreground">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {post.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-sm">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-[0.5] relative min-h-0">
          <div className="absolute inset-0 pr-4">
            <ScrollShadow>
              <div className="px-6 py-4">
                <p className="whitespace-pre-wrap text-base leading-relaxed mb-4">{post.content}</p>
                {post.mediaUrl && (
                  <div className="mt-4">
                    {post.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <ImagePreview
                        src={post.mediaUrl}
                        alt={post.title}
                        previewClassName="max-h-[40vh]"
                        modalClassName="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
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
              </div>
            </ScrollShadow>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-[0.6] border-t flex flex-col min-h-0">
          <div className="flex-none px-6 py-2 flex items-center gap-3 border-b">
            <Button
              variant={post.liked ? "default" : "ghost"}
              size="sm"
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1 h-8 ${post.liked ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
            >
              <Flame className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} />
              <span>{post.likesCount}</span>
            </Button>
            <CommentDialog
              postId={post.id}
              commentsCount={post.commentsCount}
              onCommentAdded={onCommentAdded}
            />
          </div>
          <div className="flex-none px-6 py-2">
            <CommentsSection 
              postId={post.id} 
              onCommentAdded={handleCommentAdded}
            />
          </div>
          <div className="flex-1 min-h-0 px-6">
            <ScrollShadow className="h-full">
              <CommentsList 
                postId={post.id} 
                newComment={newComment}
              />
            </ScrollShadow>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 