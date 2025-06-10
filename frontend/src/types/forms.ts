import { Post } from './post';

export type LoginFormProps = {
  onSubmit: (data: { email: string; password: string }) => void;
  className?: string;
  onSignupClick?: () => void;
}

export interface PostFormProps {
  onSuccess?: () => void;
  onPostCreated?: (post: Post) => void;
  className?: string;
}

export type SignupFormProps = {
  onSubmit: (data: { email: string; password: string }) => void;
  className?: string;
  onLoginClick?: () => void;
}

