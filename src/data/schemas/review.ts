import { z } from 'zod';

export const Rating = z.union([
  z.literal(1), // again
  z.literal(2), // hard
  z.literal(3), // good
  z.literal(4), // easy
]);
export type Rating = z.infer<typeof Rating>;

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  cardId: z.string().uuid(),
  ts: z.number(),
  rating: Rating,
  durationMs: z.number().int().min(0),
  prevState: z.number().int(),
  scheduledDays: z.number(),
  elapsedDays: z.number(),
});

export type Review = z.infer<typeof ReviewSchema>;
