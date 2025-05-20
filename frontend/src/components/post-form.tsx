'use client';

import { useState } from 'react';
import { MapPin, Calendar } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { MediaUploader } from '@/components/media-uploader';

const MAX_CHARACTERS = 280;

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(MAX_CHARACTERS, `Content must be less than ${MAX_CHARACTERS} characters`),
  image: z.instanceof(File).optional(),
  location: z.string().optional(),
  date: z.date(),
});

type FormValues = z.infer<typeof formSchema>;

export function PostForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [fileInputReset, setFileInputReset] = useState(0);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      date: new Date(),
    },
  });

 const handleMediaChange = (file: File) => {
  if (file) {
    setSelectedMedia(file);
    form.setValue("image", file); // Update form value if needed
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string' || reader.result === null) {
        setMediaPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }
};

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    setMediaPreview(null);
    setFileInputReset(prev => prev + 1);
  };




  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', values.content);
      if (selectedMedia) {
        formData.append('media', selectedMedia);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Creating post:', { ...values, media: selectedMedia });
      
      // Reset form
      form.reset();
      setSelectedMedia(null);
      setMediaPreview(null);
      toast.success('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingCharacters = MAX_CHARACTERS - (form.watch('content')?.length || 0);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Add a title..."
                        className="text-xl font-semibold border-none focus-visible:ring-0 focus-visible:ring-offset-0"
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
                    <FormControl>
                      <div className="relative">
                        <Textarea
                          placeholder="What's happening?"
                          className="text-lg border-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
                          rows={4}
                          {...field}
                        />
                        <div className="absolute bottom-2 right-2 text-sm text-muted-foreground">
                          {remainingCharacters}
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Media Preview */}
              {mediaPreview && (
                <div className="relative">
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="max-h-96 rounded-lg object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveMedia} // Use the new function
                  >
                    ×
                  </Button>
                </div>
              )}
              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex space-x-2">
                    <MediaUploader onFileChange={handleMediaChange} resetTrigger={fileInputReset} />
                  <Button type="button" variant="ghost" size="icon">
                    <Calendar className="h-5 w-5" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon">
                    <MapPin className="h-5 w-5" />
                  </Button>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                  className="rounded-full"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}