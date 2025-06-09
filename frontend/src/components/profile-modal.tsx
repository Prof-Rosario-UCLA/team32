import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { LogOut, User, Mail, Calendar, Flame, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import { PostCarousel } from "@/components/post-carousel";
import { Post } from "@/types/post";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollShadow } from "@/components/ui/scroll-shadow";
import { Badge } from "@/components/ui/badge";

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
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalComments: 0
  });

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
        // Calculate stats from the first page
        const totalLikes = data.posts.reduce((sum: number, post: Post) => sum + post.likesCount, 0);
        const totalComments = data.posts.reduce((sum: number, post: Post) => sum + post.commentsCount, 0);
        setStats({
          totalPosts: data.pagination.total,
          totalLikes,
          totalComments
        });
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

  const initials = user?.email[0].toUpperCase() || '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogTitle></DialogTitle>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0">
        {/* Fixed Header */}
        <div className="flex-none p-6 border-b">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-20 w-20">
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}`} alt={user?.email} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Profile</h2>
                <p className="text-sm text-muted-foreground">
                  Manage your account and view your activity
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center text-center gap-1 rounded-lg border p-3 w-full h-30">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold">{stats.totalLikes}</span>
                <span className="text-xs text-muted-foreground">Total Likes</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center gap-1 rounded-lg border p-3 w-full h-30">
                <MessageSquare className="h-4 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{stats.totalComments}</span>
                <span className="text-xs text-muted-foreground">Total Comments</span>
              </div>

              <div className="flex flex-col items-center justify-center text-center gap-1 rounded-lg border p-3 w-full h-30">
                <User className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.totalPosts}</span>
                <span className="text-xs text-muted-foreground">Total Posts</span>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-2">
              <h3 className="text-base font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Account Information
              </h3>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Email:</span> {user?.email}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <span className="font-medium">Member since:</span>{" "}
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Posts Section */}
        <div className="flex-1 min-h-0 border-b">
          <div className="h-full flex flex-col">
            <div className="flex-none px-6 py-3 border-b bg-muted/50">
              <h3 className="text-base font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Your Posts
              </h3>
            </div>
            <div className="flex-1 min-h-0">
              <PostCarousel
                initialPosts={posts}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                isLoading={loading}
                showSortOptions={false}
              />
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-none p-4 bg-muted/50">
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