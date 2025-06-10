import { Post } from './post';

export interface WebSocketMsg {
  type: string;
  data: Post;
  timestamp: number;
}

export interface WebSocketMessage {
  type?: string;
  data?: Post;
  timestamp?: number;
  id?: string;
  title?: string;
  content?: string;
  tags?: string[];
  mediaUrl?: string | null;
  author?: {
    id: number;
    email: string;
  };
  authorId?: number;
  commentsCount?: number;
  createdAt?: string;
  isPublished?: boolean;
  liked?: boolean;
  likesCount?: number;
  updatedAt?: string;
}

export interface NewPostNotificationProps {
  onRefresh: () => void;
  className?: string;
  currentPosts: Post[];
}
