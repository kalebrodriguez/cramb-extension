import { z } from 'zod';

export const SourceType = z.enum(['article', 'video', 'pdf', 'selection', 'manual']);
export type SourceType = z.infer<typeof SourceType>;

export const SourceSchema = z.object({
  id: z.string().uuid(),
  type: SourceType,
  url: z.string().url(),
  title: z.string().min(1),
  author: z.string().optional(),
  siteName: z.string().optional(),
  excerpt: z.string(),
  summary: z.string().optional(),
  rawText: z.string().optional(),
  contentHash: z.string(),
  capturedAt: z.number(),
});

export type Source = z.infer<typeof SourceSchema>;

export const NewSourceSchema = SourceSchema.omit({ id: true, capturedAt: true });
export type NewSource = z.infer<typeof NewSourceSchema>;
