import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { PostForm } from "../../components/forms/post-form";
import { CreatePostModalProps } from "../../types/modals";
import { ScrollShadow } from "../../components/ui/scroll-shadow";

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle className="sr-only">Create Post</DialogTitle>
      <DialogContent className="w-[95vw] max-w-[800px] h-[95vh] max-h-[800px] p-0 flex flex-col">
        <div className="flex-1 min-h-0">
          <ScrollShadow className="h-full">
            <div className="p-6">
              <PostForm 
                onSuccess={onClose} 
                onPostCreated={onPostCreated}
                className="w-full min-w-0"
              />
            </div>
          </ScrollShadow>
        </div>
      </DialogContent>
    </Dialog>
  );
}