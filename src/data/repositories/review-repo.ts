import { db } from '../db';
import type { Review } from '../schemas';

export const reviewRepo = {
  async create(review: Review): Promise<void> {
    await db.reviews.add(review);
  },

  async getByCard(cardId: string): Promise<Review[]> {
    return db.reviews.where('cardId').equals(cardId).sortBy('ts');
  },

  async getRecent(limit = 100): Promise<Review[]> {
    return db.reviews.orderBy('ts').reverse().limit(limit).toArray();
  },

  /** All reviews, oldest-first (used by stats: streak + retention). */
  async getAll(): Promise<Review[]> {
    return db.reviews.orderBy('ts').toArray();
  },

  async countToday(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    return db.reviews.where('ts').aboveOrEqual(startOfDay.getTime()).count();
  },
};
