import { z } from 'zod';

export const GeneratedCardSchema = z.object({
  type: z.enum(['basic', 'cloze', 'mcq']),
  front: z.string().min(1),
  back: z.string().min(1),
  clozeText: z.string().optional(),
  choices: z.array(z.string()).optional(),
  answerIndex: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
});

export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;

export const GenerationOutputSchema = z.object({
  summary: z.string().optional(),
  cards: z.array(GeneratedCardSchema).min(1).max(12),
});

export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;
