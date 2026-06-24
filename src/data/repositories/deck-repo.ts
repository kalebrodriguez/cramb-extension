import Dexie from 'dexie';
import { db } from '../db';
import { NewDeckSchema, type Deck, type NewDeck } from '../schemas';

export const deckRepo = {
  async create(data: NewDeck): Promise<Deck> {
    const now = Date.now();
    // parse() applies Zod defaults for omitted fields (color, newPerDay, reviewsPerDay).
    const withDefaults = NewDeckSchema.parse(data);
    const deck: Deck = {
      ...withDefaults,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.decks.add(deck);
    return deck;
  },

  async getById(id: string): Promise<Deck | undefined> {
    return db.decks.get(id);
  },

  async getBySourceId(sourceId: string): Promise<Deck | undefined> {
    return db.decks.where('sourceId').equals(sourceId).first();
  },

  async listAll(): Promise<Deck[]> {
    return db.decks.toArray();
  },

  async update(id: string, changes: Partial<Deck>): Promise<void> {
    await db.decks.update(id, { ...changes, updatedAt: Date.now() });
  },

  async delete(id: string): Promise<void> {
    await db.decks.delete(id);
  },

  /** Delete a deck and all of its cards in one transaction. */
  async deleteWithCards(id: string): Promise<number> {
    return db.transaction('rw', db.decks, db.cards, async () => {
      const removed = await db.cards.where('deckId').equals(id).delete();
      await db.decks.delete(id);
      return removed;
    });
  },

  /**
   * Move every card from `sourceId` into `targetId`, then delete the now-empty
   * source deck. Returns the number of cards moved. No-op if ids are equal.
   */
  async merge(sourceId: string, targetId: string): Promise<number> {
    if (sourceId === targetId) return 0;
    return db.transaction('rw', db.decks, db.cards, async () => {
      const target = await db.decks.get(targetId);
      if (!target) throw new Error(`Target deck ${targetId} not found`);
      const moved = await db.cards
        .where('deckId')
        .equals(sourceId)
        .modify({ deckId: targetId, updatedAt: Date.now() });
      await db.decks.delete(sourceId);
      return moved;
    });
  },

  async getCardCount(deckId: string): Promise<number> {
    return db.cards.where('deckId').equals(deckId).count();
  },

  async getDueCount(deckId: string): Promise<number> {
    return db.cards
      .where('[deckId+due]')
      .between([deckId, Dexie.minKey], [deckId, Date.now()], true, true)
      .and((c) => !c.suspended)
      .count();
  },
};
