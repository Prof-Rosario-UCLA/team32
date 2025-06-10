import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { PostForm } from "../../components/forms/post-form";
import { CreatePostModalProps } from "../../types/modals";

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="sm:max-w-[800px]">
        <PostForm onSuccess={onClose} onPostCreated={onPostCreated}           className="w-full min-w-0" />
      </DialogContent>
    </Dialog>
  );
} 