import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSocket } from '@/lib/socket';

interface NewPostNotificationProps {
  onRefresh: () => void;
  className?: string;
}

export function NewPostNotification({ onRefresh, className }: NewPostNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [newPostCount, setNewPostCount] = useState(0);

  useEffect(() => {
    const socket = getSocket();
    
    const handleNewPost = () => {
      setNewPostCount(prev => prev + 1);
      setShowNotification(true);
    };

    socket.on('new-post', handleNewPost);

    return () => {
      socket.off('new-post', handleNewPost);
    };
  }, []);

  const handleRefresh = () => {
    onRefresh();
    setShowNotification(false);
    setNewPostCount(0);
  };

  if (!showNotification) return null;

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
            {newPostCount === 1 
              ? "New post available" 
              : `${newPostCount} new posts available`}
          </span>
        </div>
      </Button>
    </div>
  );
} 