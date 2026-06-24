import type { Card, Review } from '@/data/schemas';

/** Local-day key (YYYY-M-D in local time) for grouping timestamps by calendar day. */
function dayKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfLocalDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

const DAY_MS = 86_400_000;

/**
 * Consecutive calendar days (ending today) with at least one review. Today not
 * yet having a review doesn't break the streak — it counts back from yesterday —
 * but two empty days in a row (today + yesterday) means the streak is 0.
 */
export function computeStreak(reviewTimestamps: number[], now: number): number {
  if (reviewTimestamps.length === 0) return 0;
  const days = new Set(reviewTimestamps.map(dayKey));

  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  if (!days.has(dayKey(cursor.getTime()))) {
    // Grace: today may still be in progress — start from yesterday.
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor.getTime()))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor.getTime()))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Number of non-suspended cards due on each of the next `days` days. Index 0 is
 * "due today" and folds in any overdue cards; cards due beyond the window are
 * omitted.
 */
export function dueForecast(cards: Card[], days: number, now: number): number[] {
  const result = new Array<number>(days).fill(0);
  const start = startOfLocalDay(now);
  for (const card of cards) {
    if (card.suspended) continue;
    const offset = Math.floor((card.due - start) / DAY_MS);
    const idx = Math.max(0, offset);
    if (idx < days) result[idx] = (result[idx] ?? 0) + 1;
  }
  return result;
}

/**
 * Estimated retention: share of recall attempts graded Good or better. Counts
 * only reviews of cards already in the `review` state (FSRS state 2) so that
 * learning-phase churn doesn't skew it; falls back to all reviews if there are
 * no mature ones yet. Returns null when there's nothing to measure.
 */
export function retentionRate(reviews: Review[]): number | null {
  const mature = reviews.filter((r) => r.prevState === 2);
  const pool = mature.length > 0 ? mature : reviews;
  if (pool.length === 0) return null;
  const good = pool.filter((r) => r.rating >= 3).length;
  return good / pool.length;
}

export interface Stats {
  streak: number;
  dueToday: number;
  forecast: number[];
  retention: number | null;
  totalCards: number;
  totalReviews: number;
}

/** Compute the full stats summary from raw cards + reviews. Pure; inject `now`. */
export function computeStats(
  cards: Card[],
  reviews: Review[],
  now: number = Date.now(),
  forecastDays = 7,
): Stats {
  const forecast = dueForecast(cards, forecastDays, now);
  return {
    streak: computeStreak(
      reviews.map((r) => r.ts),
      now,
    ),
    dueToday: forecast[0] ?? 0,
    forecast,
    retention: retentionRate(reviews),
    totalCards: cards.length,
    totalReviews: reviews.length,
  };
}
