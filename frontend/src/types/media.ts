export interface ImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  previewClassName?: string;
  modalClassName?: string;
}

export interface MediaUploaderProps {
  onFileChange: (file: File) => void;
  accept?: string;
  buttonVariant?: string;
  iconSize?: number;
  iconColor?: string;
  resetTrigger?: number; // + 1 trigger
}

