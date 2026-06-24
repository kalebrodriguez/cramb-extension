import Dexie from 'dexie';
import { db } from '../db';
import { NewCardSchema, type Card, type NewCard } from '../schemas';

function buildCard(data: NewCard, now: number): Card {
  // parse() applies Zod defaults for omitted fields (tags, suspended).
  const withDefaults = NewCardSchema.parse(data);
  return {
    ...withDefaults,
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
}

export const cardRepo = {
  async create(data: NewCard): Promise<Card> {
    const now = Date.now();
    const card = buildCard(data, now);
    await db.cards.add(card);
    return card;
  },

  async createMany(cards: NewCard[]): Promise<Card[]> {
    const now = Date.now();
    const fullCards = cards.map((data) => buildCard(data, now));
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

  /** Every card in the library (used by stats / due forecast). */
  async getAll(): Promise<Card[]> {
    return db.cards.toArray();
  },

  /** Suspend or unsuspend a single card (suspended cards are skipped in review). */
  async setSuspended(id: string, suspended: boolean): Promise<void> {
    await db.cards.update(id, { suspended, updatedAt: Date.now() });
  },

  /** Suspend or unsuspend every card in a deck. Returns the number affected. */
  async setSuspendedByDeck(deckId: string, suspended: boolean): Promise<number> {
    return db.cards
      .where('deckId')
      .equals(deckId)
      .modify({ suspended, updatedAt: Date.now() });
  },
};
