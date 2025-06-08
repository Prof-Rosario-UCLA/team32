'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { X, Image as ImageIcon, Mic, Square, Camera } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils"
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(1000, 'Content is too long'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  tags: z.string(),
  mediaType: z.enum(['none', 'image', 'audio']).optional(),
  mediaFile: z.any().optional(),
});

interface PostFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function PostForm({ onSuccess, className }: PostFormProps) {
  const router = useRouter();
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaType, setMediaType] = useState<'none' | 'image' | 'audio'>('none');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      imageUrl: '',
      tags: '',
      mediaType: 'none',
    },
  });

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
        form.setValue('tags', [...tags, newTag].join(','));
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue('tags', newTags.join(','));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
      setMediaType('image');
      form.setValue('mediaType', 'image');
      form.setValue('mediaFile', file);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    return () => {
      if (mediaPreview && mediaType === 'audio') {
        URL.revokeObjectURL(mediaPreview);
      }
    };
  }, [mediaPreview, mediaType]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (mediaPreview && mediaType === 'audio') {
          URL.revokeObjectURL(mediaPreview);
        }

        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setMediaPreview(audioUrl);
        form.setValue('mediaFile', audioBlob);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setMediaType('audio');
      form.setValue('mediaType', 'audio');
    } catch (error) {
      toast.error('Failed to access microphone');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recording:', error);
        toast.error('Failed to stop recording');
      }
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: { ideal: 'environment' } },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (error) {
      toast.error('Failed to access camera');
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `camera-photo-${Date.now()}.jpg`, { 
              type: 'image/jpeg',
              lastModified: Date.now()
            });

            if (!file.type.startsWith('image/')) {
              toast.error('Failed to process photo');
              return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
              setMediaPreview(reader.result as string);
              setMediaType('image');
              form.setValue('mediaType', 'image');
              form.setValue('mediaFile', file);
              stopCamera();
              toast.success('Photo captured successfully!');
            };
            reader.readAsDataURL(file);
          } else {
            toast.error('Failed to capture photo');
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  const removeMedia = () => {
    if (showCamera) {
      stopCamera();
    }
    if (mediaPreview && mediaType === 'audio') {
      URL.revokeObjectURL(mediaPreview);
    }
    setMediaPreview(null);
    setMediaType('none');
    form.setValue('mediaType', 'none');
    form.setValue('mediaFile', null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (tags.length === 0) {
      toast.error('Please add at least one tag');
      return;
    }
  
    try {
      setIsSubmitting(true);
      let mediaUrl = null;
  
      // Upload media file if present
      if (values.mediaFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', values.mediaFile);
  
        const uploadResponse = await fetch('http://localhost:3001/api/posts/media', {
          method: 'POST',
          body: uploadFormData,
          credentials: 'include',
        });
  
        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json();
          throw new Error(uploadError.error || 'Failed to upload file');
        }
  
        const uploadData = await uploadResponse.json();
        mediaUrl = uploadData.url;
      }
  
      // Create the post with the uploaded media URL
      const postData = {
        title: values.title,
        content: values.content,
        tags: tags,
        ...(mediaUrl && { mediaUrl }), 
      };
  
      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
        credentials: 'include',
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create post');
      }
  
      toast.success('Post created successfully!');
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <Form {...form}>
      <form 
        className={cn("flex flex-col gap-6", className)} 
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Create a New Post</h2>
          <p className="text-sm text-muted-foreground">
            Share your thoughts with the UCLA community
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="What's your hot take?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your thoughts..."
                    className="min-h-[200px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormItem>
            <FormLabel>Add Media (Optional)</FormLabel>
            <div className="flex gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                ref={fileInputRef}
                className="hidden"
                id="image-upload"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <ImageIcon className="h-4 w-4" />
                Upload Photo
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={startCamera}
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={isRecording ? stopRecording : startRecording}
                className={cn(
                  "flex items-center gap-2",
                  isRecording && "bg-red-100 text-red-600 hover:bg-red-200"
                )}
              >
                {isRecording ? (
                  <>
                    <Square className="h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Record Voice Memo
                  </>
                )}
              </Button>
            </div>

            <Dialog open={showCamera} onOpenChange={(open) => {
              if (!open) stopCamera();
            }}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Take a Photo</DialogTitle>
                </DialogHeader>
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={stopCamera}
                      className="bg-black/50 text-white hover:bg-black/70"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={capturePhoto}
                      className="bg-white text-black hover:bg-gray-100"
                    >
                      Capture
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {mediaPreview && (
              <div className="mt-4 relative">
                {mediaType === 'image' ? (
                  <div className="relative w-full max-w-md">
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="rounded-lg w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : mediaType === 'audio' && (
                  <div className="relative w-full max-w-md">
                    <audio
                      src={mediaPreview}
                      controls
                      className="w-full"
                      preload="metadata"
                      onError={(e) => {
                        console.error('Audio playback error:', e);
                        toast.error('Failed to play audio');
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeMedia}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </FormItem>

          <FormItem>
            <FormLabel>Tags</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Input
                  placeholder="Add tags (press Enter)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                />
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>

          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Post'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}