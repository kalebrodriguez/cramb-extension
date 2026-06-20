import { db } from '../db';
import type { Source, NewSource } from '../schemas';

export const sourceRepo = {
  async create(data: NewSource): Promise<Source> {
    const now = Date.now();
    const source: Source = {
      ...data,
      id: crypto.randomUUID(),
      capturedAt: now,
    };
    await db.sources.add(source);
    return source;
  },

  async getById(id: string): Promise<Source | undefined> {
    return db.sources.get(id);
  },

  async getByContentHash(hash: string): Promise<Source | undefined> {
    return db.sources.where('contentHash').equals(hash).first();
  },

  async listRecent(limit = 20): Promise<Source[]> {
    return db.sources.orderBy('capturedAt').reverse().limit(limit).toArray();
  },

  async delete(id: string): Promise<void> {
    await db.sources.delete(id);
  },

  async pruneRawText(id: string): Promise<void> {
    await db.sources.update(id, { rawText: undefined });
  },
};
