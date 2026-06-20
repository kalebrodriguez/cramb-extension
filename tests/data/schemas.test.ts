import { describe, it, expect } from 'vitest';
import { SourceSchema, DeckSchema, CardSchema, ReviewSchema } from '@/data/schemas';
import { GenerationOutputSchema } from '@/data/schemas/generation';

describe('SourceSchema', () => {
  it('validates a complete source', () => {
    const result = SourceSchema.safeParse({
      id: crypto.randomUUID(),
      type: 'article',
      url: 'https://example.com/post',
      title: 'Test Article',
      excerpt: 'A short excerpt…',
      contentHash: 'abc123',
      capturedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid type', () => {
    const result = SourceSchema.safeParse({
      id: crypto.randomUUID(),
      type: 'tweet',
      url: 'https://example.com',
      title: 'Test',
      excerpt: 'test',
      contentHash: 'abc',
      capturedAt: Date.now(),
    });
    expect(result.success).toBe(false);
  });
});

describe('CardSchema', () => {
  it('validates a basic card', () => {
    const result = CardSchema.safeParse({
      id: crypto.randomUUID(),
      deckId: crypto.randomUUID(),
      type: 'basic',
      front: 'What is X?',
      back: 'X is Y.',
      tags: [],
      suspended: false,
      due: Date.now(),
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty front', () => {
    const result = CardSchema.safeParse({
      id: crypto.randomUUID(),
      deckId: crypto.randomUUID(),
      type: 'basic',
      front: '',
      back: 'answer',
      tags: [],
      suspended: false,
      due: Date.now(),
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    expect(result.success).toBe(false);
  });
});

describe('GenerationOutputSchema', () => {
  it('validates LLM output with basic and cloze cards', () => {
    const result = GenerationOutputSchema.safeParse({
      summary: 'A summary of the content.',
      cards: [
        { type: 'basic', front: 'Q?', back: 'A.' },
        {
          type: 'cloze',
          front: 'The sky is [...].',
          back: 'The sky is blue.',
          clozeText: 'The sky is {{c1::blue}}.',
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty cards array', () => {
    const result = GenerationOutputSchema.safeParse({
      cards: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 12 cards', () => {
    const cards = Array.from({ length: 13 }, (_, i) => ({
      type: 'basic' as const,
      front: `Q${i}?`,
      back: `A${i}.`,
    }));
    const result = GenerationOutputSchema.safeParse({ cards });
    expect(result.success).toBe(false);
  });
});

describe('ReviewSchema', () => {
  it('validates a review log entry', () => {
    const result = ReviewSchema.safeParse({
      id: crypto.randomUUID(),
      cardId: crypto.randomUUID(),
      ts: Date.now(),
      rating: 3,
      durationMs: 4500,
      prevState: 0,
      scheduledDays: 1,
      elapsedDays: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid rating', () => {
    const result = ReviewSchema.safeParse({
      id: crypto.randomUUID(),
      cardId: crypto.randomUUID(),
      ts: Date.now(),
      rating: 5,
      durationMs: 1000,
      prevState: 0,
      scheduledDays: 1,
      elapsedDays: 0,
    });
    expect(result.success).toBe(false);
  });
});
