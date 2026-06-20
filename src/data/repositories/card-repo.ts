import Dexie from 'dexie';
import { db } from '../db';
import type { Card, NewCard } from '../schemas';

export const cardRepo = {
  async create(data: NewCard): Promise<Card> {
    const now = Date.now();
    const card: Card = {
      ...data,
      id: crypto.randomUUID(),
      due: now,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      state: 0,
      lastReview: undefined,
      createdAt: now,
      updatedAt: now,
    };
    await db.cards.add(card);
    return card;
  },

  async createMany(cards: NewCard[]): Promise<Card[]> {
    const now = Date.now();
    const fullCards: Card[] = cards.map((data) => ({
      ...data,
      id: crypto.randomUUID(),
      due: now,
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      state: 0 as const,
      lastReview: undefined,
      createdAt: now,
      updatedAt: now,
    }));
    await db.cards.bulkAdd(fullCards);
    return fullCards;
  },

  async getById(id: string): Promise<Card | undefined> {
    return db.cards.get(id);
  },

  async getDue(deckId?: string, limit = 50): Promise<Card[]> {
    const now = Date.now();
    if (deckId) {
      return db.cards
        .where('[deckId+due]')
        .between([deckId, Dexie.minKey], [deckId, now], true, true)
        .and((c) => !c.suspended)
        .limit(limit)
        .sortBy('due');
    }
    return db.cards
      .where('due')
      .belowOrEqual(now)
      .and((c) => !c.suspended)
      .limit(limit)
      .sortBy('due');
  },

  async getDueCount(deckId?: string): Promise<number> {
    const now = Date.now();
    if (deckId) {
      return db.cards
        .where('[deckId+due]')
        .between([deckId, Dexie.minKey], [deckId, now], true, true)
        .and((c) => !c.suspended)
        .count();
    }
    return db.cards
      .where('due')
      .belowOrEqual(now)
      .and((c) => !c.suspended)
      .count();
  },

  async update(id: string, changes: Partial<Card>): Promise<void> {
    await db.cards.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.cards.delete(id);
  },

  async getByDeck(deckId: string): Promise<Card[]> {
    return db.cards.where('deckId').equals(deckId).toArray();
  },
};
