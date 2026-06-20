import { fsrs, type Card as FSRSCard, type Rating, State } from 'ts-fsrs';
import type { Card } from '@/data/schemas';

// Create the FSRS scheduler instance
const f = fsrs({});

/**
 * Converts a Cramb Card into a ts-fsrs Card.
 * @param card Cramb Card entity
 * @returns ts-fsrs Card
 */
export function mapToFSRSCard(card: Card): FSRSCard {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.lastReview ? Math.floor((Date.now() - card.lastReview) / 86400000) : 0,
    scheduled_days: card.lastReview ? Math.floor((card.due - card.lastReview) / 86400000) : 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.lastReview ? new Date(card.lastReview) : undefined,
    learning_steps: 0,
  };
}

/**
 * Calculates the next states for a card given a rating (1=Again, 2=Hard, 3=Good, 4=Easy).
 * @param card Cramb Card entity
 * @param rating 1 (Again), 2 (Hard), 3 (Good), or 4 (Easy)
 * @returns Partial Card updates to apply
 */
export function scheduleCard(card: Card, rating: Rating): Partial<Card> {
  const fsrsCard = mapToFSRSCard(card);
  const now = new Date();
  
  // Calculate next states using the FSRS engine
  const schedulingRecord = f.repeat(fsrsCard, now);
  // mapping index for Rating inside ts-fsrs output
  const nextRecord = schedulingRecord[String(rating) as unknown as keyof typeof schedulingRecord] as unknown as { card?: FSRSCard };
  
  if (!nextRecord || !nextRecord.card) {
    throw new Error(`Invalid FSRS rating passed: ${rating}`);
  }

  const newCardState = nextRecord.card;
  
  return {
    due: newCardState.due.getTime(),
    stability: newCardState.stability,
    difficulty: newCardState.difficulty,
    reps: newCardState.reps,
    lapses: newCardState.lapses,
    state: newCardState.state,
    lastReview: now.getTime(),
  };
}

/**
 * Useful to show the user when the card will be next due before they click a grade.
 * @param card Cramb Card entity
 * @returns An object with intervals for all 4 ratings (in milliseconds from now)
 */
export function getNextIntervals(card: Card): Record<1 | 2 | 3 | 4, number> {
  const fsrsCard = mapToFSRSCard(card);
  const now = new Date();
  const schedulingRecord = f.repeat(fsrsCard, now);
  
  return {
    1: (schedulingRecord[1 as keyof typeof schedulingRecord] as unknown as { card: FSRSCard }).card.due.getTime() - now.getTime(),
    2: (schedulingRecord[2 as keyof typeof schedulingRecord] as unknown as { card: FSRSCard }).card.due.getTime() - now.getTime(),
    3: (schedulingRecord[3 as keyof typeof schedulingRecord] as unknown as { card: FSRSCard }).card.due.getTime() - now.getTime(),
    4: (schedulingRecord[4 as keyof typeof schedulingRecord] as unknown as { card: FSRSCard }).card.due.getTime() - now.getTime(),
  };
}
