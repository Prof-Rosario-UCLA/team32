import { z } from "zod"

export const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title is too long'),
  content: z.string().min(1, 'Content is required').max(1000, 'Content is too long'),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  tags: z.string(),
  mediaType: z.enum(['none', 'image', 'audio']).optional(),
  mediaFile: z.any().optional(),
});