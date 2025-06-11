import { useEffect, useState, useRef } from 'react';
import { Button } from '../../components/ui/button';
import { Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getSocket } from '../../lib/socket';
import type { Post } from '../../types/post';
import { WebSocketMsg } from '../../types/websocket';
import type { NewPostNotificationProps } from '../../types/websocket';

export function NewPostNotification({ onRefresh, className, currentPosts }: NewPostNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [unseenPosts, setUnseenPosts] = useState<Post[]>([]);
  const initialPostIds = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!hasInitialized.current && currentPosts.length > 0) {
      initialPostIds.current = new Set(currentPosts.map(post => post.id));
      hasInitialized.current = true;
    }
  }, [currentPosts]);

  useEffect(() => {
    if (currentPosts.length > 0) {
      const currentPostIds = new Set(currentPosts.map(post => post.id));
      
      setUnseenPosts(prev => {
        const stillUnseen = prev.filter(post => !currentPostIds.has(post.id));
        
        if (stillUnseen.length === 0 && prev.length > 0) {
          setShowNotification(false);
        }
        
        return stillUnseen;
      });
    }
  }, [currentPosts]);

  useEffect(() => {
    const socket = getSocket();
    
    const handleNewPost = (message: WebSocketMsg) => {
      if (!message?.data || !message.data.id || !Array.isArray(message.data.tags)) {
        console.error('Invalid post data received:', message);
        return;
      }

      const newPost = message.data;
      const currentPostIds = new Set(currentPosts.map(post => post.id));
      
      // Only show notification if:
      // 1. The post is not in the current posts list (not displayed)
      // 2. The post was not part of the initial load (truly new)
      // 3. We haven't already added it to unseenPosts
      const isNewPost = !currentPostIds.has(newPost.id) && 
                       !initialPostIds.current.has(newPost.id);
      
      if (isNewPost) {
        setUnseenPosts(prev => {
          if (prev.some(p => p.id === newPost.id)) {
            return prev;
          }
          
          const updated = [...prev, newPost];
          setShowNotification(true);
          return updated;
        });
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

  useEffect(() => {
    if (unseenPosts.length === 0 && showNotification) {
      setShowNotification(false);
    }
  }, [unseenPosts.length, showNotification]);

  if (!showNotification || unseenPosts.length === 0) return null;

  return (
    <div className={cn(
      "fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300",
      className
    )}>
      <Button
        onClick={handleRefresh}
        size="lg"
        className="rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-6 h-auto transition-all hover:scale-105"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unseenPosts.length > 0 && (
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] text-white font-bold">
                  {unseenPosts.length > 9 ? '9+' : unseenPosts.length}
                </span>
              </div>
            )}
          </div>
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