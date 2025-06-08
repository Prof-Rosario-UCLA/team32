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
      "fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4",
      className
    )}>
      <Button
        onClick={handleRefresh}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Bell className="h-4 w-4" />
        {newPostCount === 1 
          ? "New post available" 
          : `${newPostCount} new posts available`}
      </Button>
    </div>
  );
} 