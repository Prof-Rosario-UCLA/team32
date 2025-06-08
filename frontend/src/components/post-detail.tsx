import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollShadow } from "@/components/ui/scroll-shadow"
import { CommentDialog } from '@/components/comment-dialog';
import { CommentsSection } from '@/components/comments-section';

interface Post {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
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
      <DialogContent className="max-w-3xl h-[98vh] p-0 flex flex-col">
        {/* Header - Proper spacing */}
        <div className="flex-none px-6 py-4 border-b">
          <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
          <div className="flex items-center gap-3 mb-3">
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

        <div className="flex-1 relative">
          <div className="absolute inset-0 pr-4">
            <ScrollShadow>
              <div className="px-6 py-4">
                <p className="whitespace-pre-wrap text-base leading-relaxed">{post.content}</p>
                {post.imageUrl && (
                  <img 
                    src={post.imageUrl} 
                    alt={post.title}
                    className="rounded-lg object-cover w-full max-h-[40vh] mt-4"
                  />
                )}
              </div>
            </ScrollShadow>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="flex-none border-t">
          <div className="px-6 py-2 flex items-center gap-3">
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
          <div className="border-t">
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