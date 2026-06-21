import { z } from 'zod';

export const SourceType = z.enum(['article', 'video', 'pdf', 'selection', 'manual']);
export type SourceType = z.infer<typeof SourceType>;

/** A timed transcript segment, used for video sources (timestamp deep-links). */
export const TranscriptSegmentSchema = z.object({
  start: z.number(), // seconds from video start
  text: z.string(),
});
export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>;

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
  segments: z.array(TranscriptSegmentSchema).optional(),
  contentHash: z.string(),
  capturedAt: z.number(),
});

export type Source = z.infer<typeof SourceSchema>;

export const NewSourceSchema = SourceSchema.omit({ id: true, capturedAt: true });
export type NewSource = z.infer<typeof NewSourceSchema>;
