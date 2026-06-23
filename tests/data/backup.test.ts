import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/data/db';
import { backup } from '@/data/backup';
import { deckRepo, cardRepo, sourceRepo, reviewRepo } from '@/data/repositories';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function seed() {
  const deck = await deckRepo.create({ name: 'Bio' });
  await cardRepo.create({ deckId: deck.id, type: 'basic', front: 'Q1', back: 'A1', tags: [], suspended: false });
  await cardRepo.create({ deckId: deck.id, type: 'basic', front: 'Q2', back: 'A2', tags: [], suspended: false });
  await sourceRepo.create({
    type: 'article',
    url: 'https://example.com/a',
    title: 'An Article',
    excerpt: 'x',
    contentHash: 'h1',
  });
  await reviewRepo.create({
    id: crypto.randomUUID(),
    cardId: crypto.randomUUID(),
    ts: Date.now(),
    rating: 3,
    durationMs: 1200,
    prevState: 0,
    scheduledDays: 1,
    elapsedDays: 0,
  });
  return deck;
}

describe('backup.export', () => {
  it('snapshots every table with app/version metadata', async () => {
    await seed();
    const snap = await backup.export();
    expect(snap.app).toBe('cramb');
    expect(snap.version).toBe(1);
    expect(snap.decks).toHaveLength(1);
    expect(snap.cards).toHaveLength(2);
    expect(snap.sources).toHaveLength(1);
    expect(snap.reviews).toHaveLength(1);
  });
});

describe('backup.import', () => {
  it('round-trips: export then import into a cleared library restores everything', async () => {
    await seed();
    const snap = await backup.export();

    // Wipe the library.
    await db.delete();
    await db.open();
    expect(await db.cards.count()).toBe(0);

    // Restore from the JSON-serialized snapshot (as a real import would receive it).
    const counts = await backup.import(JSON.parse(JSON.stringify(snap)));
    expect(counts).toEqual({ decks: 1, cards: 2, sources: 1, reviews: 1 });

    const restored = await backup.export();
    expect(restored.cards.map((c) => c.front).sort()).toEqual(['Q1', 'Q2']);
    expect(restored.decks[0]?.name).toBe('Bio');
  });

  it('replaces existing data rather than merging', async () => {
    await seed();
    const snap = await backup.export();
    // Add an extra deck that should be gone after import.
    await deckRepo.create({ name: 'Throwaway' });
    expect(await db.decks.count()).toBe(2);

    await backup.import(JSON.parse(JSON.stringify(snap)));
    expect(await db.decks.count()).toBe(1);
  });

  it('rejects an invalid backup without touching the library', async () => {
    await seed();
    await expect(backup.import({ app: 'notcramb', version: 99 })).rejects.toThrow();
    // Library is untouched.
    expect(await db.cards.count()).toBe(2);
  });
});
