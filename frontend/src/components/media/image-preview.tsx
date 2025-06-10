'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/../components/ui/dialog";
import { cn } from "@/../lib/utils";
import { ImagePreviewProps } from "@/../types/media";
import Image from "next/image";

export function ImagePreview({ 
  src, 
  alt, 
  previewClassName,
  modalClassName 
}: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Ensure src is a full URL
  const imageUrl = src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src}`;

  return (
    <>
      <Image
        src={imageUrl}
        alt={alt}
        onClick={() => setIsOpen(true)}
        className={cn(
          "rounded-lg object-contain w-full bg-muted/10 cursor-pointer transition-transform hover:scale-[1.02]",
          previewClassName
        )}
      />
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTitle></DialogTitle>
        <DialogContent className={cn("max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none", modalClassName)}>
          <div className="relative w-full h-full flex items-center justify-center">
            <Image
              src={imageUrl} 
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 