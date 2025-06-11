'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "../../components/ui/dialog";
import { Button } from "../../components/ui/button";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { ImagePreviewProps } from "../../types/media";
import { withStopEvent, stopEvent } from "../../utils/stop-event";

export function ImagePreview({ 
  src, 
  alt, 
  previewClassName,
  modalClassName 
}: ImagePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);

  const imageUrl = src.startsWith('http') ? src : `${process.env.NEXT_PUBLIC_API_URL}${src}`;

  return (
    <>
      <div onClick={stopEvent}>
        <img
          src={imageUrl}
          alt={alt}
          onClick={withStopEvent(() => setIsOpen(true))}
          loading="lazy"
          className={cn(
            "rounded-lg object-contain w-full bg-muted/10 cursor-pointer transition-transform hover:scale-[1.02]",
            previewClassName
          )}
        />
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTitle className="sr-only">Image Preview</DialogTitle>
          <DialogContent 
            className={cn("max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none overflow-hidden [&>button]:hidden", modalClassName)}
            onClick={stopEvent}
          >
            <div className="relative w-full h-full flex items-center justify-center">              
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={withStopEvent(() => setIsOpen(false))}
                  className="absolute top-2 right-2 z-50 h-8 w-8 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-sm shadow-lg"
                >
                  <span className="sr-only">Close</span>
                  <X className="h-4 w-4" />
                </Button>
                
                <img
                  src={imageUrl} 
                  alt={alt}
                  loading="lazy"
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}