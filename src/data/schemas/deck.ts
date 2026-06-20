import { z } from 'zod';

export const DeckSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().default('violet'),
  sourceId: z.string().uuid().optional(),
  newPerDay: z.number().int().min(0).default(20),
  reviewsPerDay: z.number().int().min(0).default(200),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Deck = z.infer<typeof DeckSchema>;

export const NewDeckSchema = DeckSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type NewDeck = z.infer<typeof NewDeckSchema>;
