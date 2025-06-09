import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { PostCarousel } from "@/components/post-carousel";
import { Post } from "@/types/post";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNum, setPageNum] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchUserPosts = async (page: number) => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/posts/user/${user.id}?page=${page}&limit=5`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to fetch posts');

      const data = await response.json();
      if (page === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      setHasMore(data.posts.length === 5);
      setPageNum(page);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchUserPosts(1);
    }
  }, [isOpen, user]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchUserPosts(pageNum + 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="sm:max-w-[800px] h-[60vh] flex flex-col">
        <div className="space-y-1 text-center mb-1">
          <h2 className="text-xl font-semibold tracking-tight">Profile</h2>
          <p className="text-sm text-muted-foreground">
            Manage your account settings and view your posts
          </p>
        </div>

        <div className="flex flex-col gap-2 flex-1 min-h-0">
          <div className="space-y-1">
            <h3 className="text-base font-medium">Account Information</h3>
            <div className="rounded-lg border p-2">
              <div className="text-sm">
                <span className="font-medium">Email:</span> {user?.email}
              </div>
            </div>
          </div>

          <div className="space-y-1 flex-1 min-h-0">
            <h3 className="text-base font-medium">Your Posts</h3>
            <div className="h-[calc(100%-1.5rem)] max-h-[500px]">
              <PostCarousel
                initialPosts={posts}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={loading}
                showSortOptions={false}
              />
            </div>
          </div>

          <Button
            variant="destructive"
            className="w-full mt-1"
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