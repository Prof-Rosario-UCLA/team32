export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: number;
    anonymousName: string;
  };
}

export interface CommentsSectionProps {
  postId: string;
  onCommentAdded: (comment: Comment) => void;
}

export interface CommentsListProps {
  postId: string;
  newComment?: Comment;
}

export interface CommentDialogProps {
  postId: string;
  commentsCount: number;
  onCommentAdded: () => void;
}
