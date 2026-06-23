import { db } from './db';
import { BackupSchema, BACKUP_VERSION, type Backup } from './schemas';

/**
 * Library export/import. This is part of the data layer, so it touches Dexie
 * directly (the repository-bypass rule applies to UI/SW, not to the data layer
 * itself). Used by the background `library.export` / `library.import` handlers.
 */
export const backup = {
  /** Snapshot the entire library into a plain, serializable object. */
  async export(): Promise<Backup> {
    const [decks, cards, sources, reviews] = await Promise.all([
      db.decks.toArray(),
      db.cards.toArray(),
      db.sources.toArray(),
      db.reviews.toArray(),
    ]);
    return {
      app: 'cramb',
      version: BACKUP_VERSION,
      exportedAt: Date.now(),
      decks,
      cards,
      sources,
      reviews,
    };
  },

  /**
   * Replace the entire library with the contents of a backup. Validates with
   * Zod first (untrusted file input), then swaps every table in a single
   * transaction so a failure can't leave a half-restored library.
   * Returns per-table counts.
   */
  async import(raw: unknown): Promise<{ decks: number; cards: number; sources: number; reviews: number }> {
    const parsed = BackupSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid backup file: ${parsed.error.issues[0]?.message ?? 'unrecognized format'}`);
    }
    const data = parsed.data;

    await db.transaction('rw', db.decks, db.cards, db.sources, db.reviews, async () => {
      await Promise.all([db.decks.clear(), db.cards.clear(), db.sources.clear(), db.reviews.clear()]);
      await Promise.all([
        db.decks.bulkAdd(data.decks),
        db.cards.bulkAdd(data.cards),
        db.sources.bulkAdd(data.sources),
        db.reviews.bulkAdd(data.reviews),
      ]);
    });

    return {
      decks: data.decks.length,
      cards: data.cards.length,
      sources: data.sources.length,
      reviews: data.reviews.length,
    };
  },
};
