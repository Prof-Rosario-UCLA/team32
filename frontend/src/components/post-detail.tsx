import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollShadow } from "@/components/ui/scroll-shadow"
import { CommentDialog } from '@/components/comment-dialog';
import { CommentsSection } from '@/components/comments-section';
import { ImagePreview } from "@/components/image-preview";

interface Post {
  id: string;
  title: string;
  content: string;
  mediaUrl?: string;
  tags: string[];
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  liked: boolean;
}

interface PostDetailProps {
  post: Post;
  onClose: () => void;
  onLike: (postId: string) => void;
  onCommentAdded: () => void;
}

export function PostDetail({ post, onClose, onLike, onCommentAdded }: PostDetailProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="max-w-4xl h-[90vh] p-0 flex flex-col">
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
        <div className="flex-1 relative min-h-0">
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
                        previewClassName="max-h-[50vh]"
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
        <div className="flex-none border-t">
          <div className="px-6 py-2 flex items-center gap-3 border-b">
            <Button
              variant={post.liked ? "default" : "ghost"}
              size="sm"
              onClick={() => onLike(post.id)}
              className="flex items-center gap-1 h-8"
            >
              <Heart className={`h-4 w-4 ${post.liked ? "fill-current" : ""}`} />
              <span>{post.likesCount}</span>
            </Button>
            <CommentDialog
              postId={post.id}
              commentsCount={post.commentsCount}
              onCommentAdded={onCommentAdded}
            />
          </div>
          <div className="h-[30vh] overflow-y-auto">
            <div className="px-6 py-2">
              <CommentsSection 
                postId={post.id} 
                onCommentAdded={onCommentAdded}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 