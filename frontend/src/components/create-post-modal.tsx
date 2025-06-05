import { Dialog, DialogContent } from "@/components/ui/dialog";
import { PostForm } from "@/components/post-form";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <PostForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
} 