import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/data/db';
import { sourceRepo, deckRepo, cardRepo, reviewRepo } from '@/data/repositories';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

describe('sourceRepo', () => {
  it('creates and retrieves a source', async () => {
    const source = await sourceRepo.create({
      type: 'article',
      url: 'https://example.com/test',
      title: 'Test Article',
      excerpt: 'An excerpt.',
      contentHash: 'hash123',
    });

    expect(source.id).toBeDefined();
    expect(source.capturedAt).toBeGreaterThan(0);

    const found = await sourceRepo.getById(source.id);
    expect(found?.title).toBe('Test Article');
  });

  it('finds by content hash', async () => {
    await sourceRepo.create({
      type: 'article',
      url: 'https://example.com',
      title: 'Test',
      excerpt: 'test',
      contentHash: 'unique-hash',
    });

    const found = await sourceRepo.getByContentHash('unique-hash');
    expect(found).toBeDefined();
    expect(found?.title).toBe('Test');
  });
});

describe('deckRepo', () => {
  it('creates and lists decks', async () => {
    await deckRepo.create({ name: 'React Hooks' });
    await deckRepo.create({ name: 'TypeScript' });

    const all = await deckRepo.listAll();
    expect(all).toHaveLength(2);
  });
});

describe('cardRepo', () => {
  it('creates cards and queries due cards', async () => {
    const deck = await deckRepo.create({ name: 'Test Deck' });
    await cardRepo.create({
      deckId: deck.id,
      type: 'basic',
      front: 'What is 1+1?',
      back: '2',
      tags: [],
      suspended: false,
    });

    const due = await cardRepo.getDue();
    expect(due.length).toBeGreaterThanOrEqual(1);
    expect(due[0]!.front).toBe('What is 1+1?');
  });

  it('bulk creates cards', async () => {
    const deck = await deckRepo.create({ name: 'Bulk Deck' });
    const cards = await cardRepo.createMany([
      { deckId: deck.id, type: 'basic', front: 'Q1', back: 'A1', tags: [], suspended: false },
      { deckId: deck.id, type: 'basic', front: 'Q2', back: 'A2', tags: [], suspended: false },
      { deckId: deck.id, type: 'cloze', front: '[...]', back: 'Answer', clozeText: '{{c1::Answer}}', tags: [], suspended: false },
    ]);
    expect(cards).toHaveLength(3);

    const count = await cardRepo.getDueCount(deck.id);
    expect(count).toBe(3);
  });

  it('respects suspended flag in due queries', async () => {
    const deck = await deckRepo.create({ name: 'Suspended Test' });
    await cardRepo.create({
      deckId: deck.id,
      type: 'basic',
      front: 'Suspended Q',
      back: 'A',
      tags: [],
      suspended: true,
    });

    const due = await cardRepo.getDue(deck.id);
    expect(due).toHaveLength(0);
  });
});
