export interface Post {
  id: string;
  title: string;
  content: string;
  tags: string[];
  mediaUrl?: string;
  createdAt: string;
  author: {
    id: number;
    email: string;
  };
  likesCount: number;
  commentsCount: number;
  liked: boolean;
} 