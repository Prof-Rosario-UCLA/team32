import { useEffect, useState } from 'react';
import { Button } from '@/../components/ui/button';
import { Bell } from 'lucide-react';
import { cn } from '@/../lib/utils';
import { getSocket } from '@/../lib/socket';
import type { Post } from '../../types/post';
import { WebSocketMsg } from '../../types/websocket';
import type { NewPostNotificationProps } from '../../types/websocket';

export function NewPostNotification({ onRefresh, className, currentPosts }: NewPostNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [unseenPosts, setUnseenPosts] = useState<Post[]>([]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleNewPost = (message: WebSocketMsg) => {
      if (!message?.data || !message.data.id || !Array.isArray(message.data.tags)) {
        console.error('Invalid post data received:', message);
        return;
      }
      // Only add to unseen posts if it's not already displayed
      if (!currentPosts.some(existingPost => existingPost.id === message.data.id)) {
        setUnseenPosts(prev => [...prev, message.data]);
        setShowNotification(true);
      }
    };

    socket.on('new_post', handleNewPost);

    return () => {
      socket.off('new_post', handleNewPost);
    };
  }, [currentPosts]);

  const handleRefresh = () => {
    onRefresh();
    setShowNotification(false);
    setUnseenPosts([]);
  };

  if (!showNotification || unseenPosts.length === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
      className
    )}>
      <Button
        onClick={handleRefresh}
        size="lg"
        className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-6 h-auto"
      >
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <span className="font-medium">
            {unseenPosts.length === 1 
              ? "New post available" 
              : `${unseenPosts.length} new posts available`}
          </span>
        </div>
      </Button>
    </div>
  );
}