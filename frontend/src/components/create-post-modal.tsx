import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PostForm } from "@/components/post-form";
import { Post } from "@/types/post";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="sm:max-w-[800px]">
        <PostForm onSuccess={onClose} onPostCreated={onPostCreated} />
      </DialogContent>
    </Dialog>
  );
} 