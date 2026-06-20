import Dexie from 'dexie';
import { db } from '../db';
import type { Deck, NewDeck } from '../schemas';

export const deckRepo = {
  async create(data: NewDeck): Promise<Deck> {
    const now = Date.now();
    const deck: Deck = {
      ...data,
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
