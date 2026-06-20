import Dexie, { type EntityTable } from 'dexie';
import type { Source, Deck, Card, Review } from './schemas';

export class CrambDB extends Dexie {
  sources!: EntityTable<Source, 'id'>;
  decks!: EntityTable<Deck, 'id'>;
  cards!: EntityTable<Card, 'id'>;
  reviews!: EntityTable<Review, 'id'>;
  meta!: EntityTable<{ key: string; value: string }, 'key'>;

  constructor() {
    super('cramb');

    this.version(1).stores({
      sources: 'id, contentHash, capturedAt, type',
      decks: 'id, name, sourceId',
      cards: 'id, deckId, sourceId, due, state, [deckId+due], *tags',
      reviews: 'id, cardId, ts',
      meta: 'key',
    });
  }
}

export const db = new CrambDB();
