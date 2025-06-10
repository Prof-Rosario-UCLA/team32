// components/MediaUploader.jsx
'use client';

import { useRef, MouseEvent, ChangeEvent, useEffect } from 'react';
import { ImageIcon } from 'lucide-react';
import { Button } from '@/../components/ui/button';
import { MediaUploaderProps } from '@/../types/media';

export function MediaUploader({ 
  onFileChange, 
  accept = "image/*", 
  iconSize = 5,
  iconColor = "text-blue-500" ,
  resetTrigger
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [resetTrigger]);

  const handleButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileChange) {
      onFileChange(file);
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button 
        type="button" 
        variant="ghost"
        size="icon"
        onClick={handleButtonClick}
      >
        <ImageIcon className={`h-${iconSize} w-${iconSize} ${iconColor}`} />
      </Button>
    </div>
  );
}