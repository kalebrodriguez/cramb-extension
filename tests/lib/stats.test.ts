import { describe, it, expect } from 'vitest';
import { computeStreak, dueForecast, retentionRate, computeStats } from '@/lib/stats';
import type { Card, Review } from '@/data/schemas';

const DAY = 86_400_000;
// Fixed "now": 2026-06-22 12:00 local.
const NOW = new Date(2026, 5, 22, 12, 0, 0).getTime();

function review(partial: Partial<Review>): Review {
  return {
    id: crypto.randomUUID(),
    cardId: crypto.randomUUID(),
    ts: NOW,
    rating: 3,
    durationMs: 1000,
    prevState: 2,
    scheduledDays: 1,
    elapsedDays: 1,
    ...partial,
  };
}

function card(partial: Partial<Card>): Card {
  return {
    id: crypto.randomUUID(),
    deckId: crypto.randomUUID(),
    type: 'basic',
    front: 'f',
    back: 'b',
    tags: [],
    suspended: false,
    due: NOW,
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: 2,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    const ts = [NOW, NOW - DAY, NOW - 2 * DAY];
    expect(computeStreak(ts, NOW)).toBe(3);
  });

  it('keeps the streak when today has no reviews yet (grace day)', () => {
    const ts = [NOW - DAY, NOW - 2 * DAY];
    expect(computeStreak(ts, NOW)).toBe(2);
  });

  it('breaks when both today and yesterday are empty', () => {
    const ts = [NOW - 2 * DAY, NOW - 3 * DAY];
    expect(computeStreak(ts, NOW)).toBe(0);
  });

  it('is 0 with no reviews', () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it('stops at the first gap', () => {
    const ts = [NOW, NOW - DAY, NOW - 3 * DAY]; // gap at day 2
    expect(computeStreak(ts, NOW)).toBe(2);
  });
});

describe('dueForecast', () => {
  it('buckets cards by day and folds overdue into today', () => {
    const cards = [
      card({ due: NOW - 5 * DAY }), // overdue -> today
      card({ due: NOW }), // today
      card({ due: NOW + DAY }), // tomorrow
      card({ due: NOW + DAY + 1000 }), // tomorrow
      card({ due: NOW + 6 * DAY }), // day 6
      card({ due: NOW + 30 * DAY }), // beyond window -> omitted
    ];
    const f = dueForecast(cards, 7, NOW);
    expect(f[0]).toBe(2); // overdue + today
    expect(f[1]).toBe(2); // tomorrow
    expect(f[6]).toBe(1);
    expect(f).toHaveLength(7);
  });

  it('skips suspended cards', () => {
    const cards = [card({ due: NOW }), card({ due: NOW, suspended: true })];
    expect(dueForecast(cards, 3, NOW)[0]).toBe(1);
  });
});

describe('retentionRate', () => {
  it('is the share of mature reviews graded good or better', () => {
    const reviews = [
      review({ rating: 4, prevState: 2 }),
      review({ rating: 3, prevState: 2 }),
      review({ rating: 1, prevState: 2 }),
      review({ rating: 2, prevState: 2 }),
    ];
    expect(retentionRate(reviews)).toBe(0.5);
  });

  it('ignores learning-phase reviews when mature ones exist', () => {
    const reviews = [
      review({ rating: 4, prevState: 2 }), // mature, pass
      review({ rating: 1, prevState: 0 }), // learning, excluded
    ];
    expect(retentionRate(reviews)).toBe(1);
  });

  it('returns null with no reviews', () => {
    expect(retentionRate([])).toBeNull();
  });
});

describe('computeStats', () => {
  it('aggregates everything', () => {
    const cards = [card({ due: NOW }), card({ due: NOW + DAY })];
    const reviews = [review({ ts: NOW, rating: 3 })];
    const s = computeStats(cards, reviews, NOW);
    expect(s.totalCards).toBe(2);
    expect(s.totalReviews).toBe(1);
    expect(s.dueToday).toBe(1);
    expect(s.streak).toBe(1);
    expect(s.retention).toBe(1);
  });
});
