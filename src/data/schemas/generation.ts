import { z } from 'zod';

export const GeneratedCardSchema = z
  .object({
    type: z.enum(['basic', 'cloze', 'mcq']),
    front: z.string().min(1),
    back: z.string().min(1),
    clozeText: z.string().optional(),
    choices: z.array(z.string()).optional(),
    answerIndex: z.number().int().min(0).optional(),
    tags: z.array(z.string()).optional(),
  })
  .superRefine((card, ctx) => {
    // MCQ cards must carry at least two choices and a valid answer index.
    if (card.type === 'mcq') {
      if (!card.choices || card.choices.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'mcq cards need at least 2 choices', path: ['choices'] });
        return;
      }
      if (
        card.answerIndex === undefined ||
        card.answerIndex < 0 ||
        card.answerIndex >= card.choices.length
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'mcq answerIndex must point at a choice',
          path: ['answerIndex'],
        });
      }
    }
  });

export type GeneratedCard = z.infer<typeof GeneratedCardSchema>;

export const GenerationOutputSchema = z.object({
  summary: z.string().optional(),
  cards: z.array(GeneratedCardSchema).min(1).max(12),
});

export type GenerationOutput = z.infer<typeof GenerationOutputSchema>;
