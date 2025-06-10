import { Post } from './post';

export interface AuthModalsProps {
  isLoginOpen: boolean;
  isSignupOpen: boolean;
  onLoginClose: () => void;
  onSignupClose: () => void;
  onLoginOpen: () => void;
  onSignupOpen: () => void;
}

export interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated?: (post: Post) => void;
}

export type ForgotPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export type ResetPasswordModalProps = {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
};

export interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface UserAvatarProps {
  user: {
    email: string;
    name?: string;
  };
}