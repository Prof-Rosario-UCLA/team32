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

export type SortOption = {
  label: string;
  sortBy: string;
  order: 'asc' | 'desc';
};

export interface PostCarouselProps {
  initialPosts?: Post[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  showSortOptions?: boolean;
  containerMode?: 'fullscreen' | 'contained'; // Add this prop
}

export interface PostDetailProps {
  post: Post;
  onClose: () => void;
  onLike: (postId: string) => void;
  onCommentAdded: () => void;
}

export interface TrendingTopic {
    id: string;
    title: string;
    heat: number;
    likes: number;
    comments: number;
    createdAt: string;
}