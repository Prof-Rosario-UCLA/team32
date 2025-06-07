import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="sm:max-w-[425px]">
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account settings
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Account Information</h3>
            <div className="rounded-lg border p-4">
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Email:</span> {user.email}
                </div>
              </div>
            </div>
          </div>

          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => {
              logout();
              onClose();
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 