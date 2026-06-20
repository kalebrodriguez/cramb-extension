import { z } from 'zod';

export const CardType = z.enum(['basic', 'cloze', 'mcq']);
export type CardType = z.infer<typeof CardType>;

export const FSRSState = z.union([
  z.literal(0), // new
  z.literal(1), // learning
  z.literal(2), // review
  z.literal(3), // relearning
]);
export type FSRSState = z.infer<typeof FSRSState>;

export const CardSchema = z.object({
  id: z.string().uuid(),
  deckId: z.string().uuid(),
  sourceId: z.string().uuid().optional(),
  type: CardType,
  front: z.string().min(1),
  back: z.string().min(1),
  clozeText: z.string().optional(),
  choices: z.array(z.string()).optional(),
  answerIndex: z.number().int().min(0).optional(),
  tags: z.array(z.string()).default([]),
  suspended: z.boolean().default(false),
  due: z.number(),
  stability: z.number().default(0),
  difficulty: z.number().default(0),
  reps: z.number().int().default(0),
  lapses: z.number().int().default(0),
  state: FSRSState.default(0),
  lastReview: z.number().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export type Card = z.infer<typeof CardSchema>;

export const NewCardSchema = CardSchema.omit({
  id: true,
  due: true,
  stability: true,
  difficulty: true,
  reps: true,
  lapses: true,
  state: true,
  lastReview: true,
  createdAt: true,
  updatedAt: true,
});
export type NewCard = z.infer<typeof NewCardSchema>;
