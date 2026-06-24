import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/data/db';
import { deckRepo, cardRepo, sourceRepo, searchRepo } from '@/data/repositories';
import { tokenize, scoreText } from '@/data/repositories/search-repo';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

async function makeCard(deckId: string, front: string, back: string, tags: string[] = []) {
  return cardRepo.create({ deckId, type: 'basic', front, back, tags, suspended: false });
}

describe('deck management', () => {
  it('merges cards from one deck into another and removes the source deck', async () => {
    const a = await deckRepo.create({ name: 'A' });
    const b = await deckRepo.create({ name: 'B' });
    await makeCard(a.id, 'Q1', 'A1');
    await makeCard(a.id, 'Q2', 'A2');
    await makeCard(b.id, 'Q3', 'A3');

    const moved = await deckRepo.merge(a.id, b.id);
    expect(moved).toBe(2);
    expect(await deckRepo.getById(a.id)).toBeUndefined();
    expect(await deckRepo.getCardCount(b.id)).toBe(3);
  });

  it('merge is a no-op when source and target are the same', async () => {
    const a = await deckRepo.create({ name: 'A' });
    await makeCard(a.id, 'Q', 'A');
    expect(await deckRepo.merge(a.id, a.id)).toBe(0);
    expect(await deckRepo.getCardCount(a.id)).toBe(1);
  });

  it('merge throws when the target is missing', async () => {
    const a = await deckRepo.create({ name: 'A' });
    await expect(deckRepo.merge(a.id, crypto.randomUUID())).rejects.toThrow();
  });

  it('deleteWithCards removes the deck and its cards', async () => {
    const a = await deckRepo.create({ name: 'A' });
    await makeCard(a.id, 'Q1', 'A1');
    await makeCard(a.id, 'Q2', 'A2');

    const removed = await deckRepo.deleteWithCards(a.id);
    expect(removed).toBe(2);
    expect(await deckRepo.getById(a.id)).toBeUndefined();
    expect(await db.cards.count()).toBe(0);
  });
});

describe('card suspend', () => {
  it('suspends and unsuspends a single card', async () => {
    const deck = await deckRepo.create({ name: 'D' });
    const card = await makeCard(deck.id, 'Q', 'A');

    await cardRepo.setSuspended(card.id, true);
    expect(await cardRepo.getDue(deck.id)).toHaveLength(0);

    await cardRepo.setSuspended(card.id, false);
    expect(await cardRepo.getDue(deck.id)).toHaveLength(1);
  });

  it('suspends every card in a deck', async () => {
    const deck = await deckRepo.create({ name: 'D' });
    await makeCard(deck.id, 'Q1', 'A1');
    await makeCard(deck.id, 'Q2', 'A2');

    const count = await cardRepo.setSuspendedByDeck(deck.id, true);
    expect(count).toBe(2);
    expect(await cardRepo.getDue(deck.id)).toHaveLength(0);
  });
});

describe('search helpers', () => {
  it('tokenizes, lowercasing and dropping short tokens', () => {
    expect(tokenize('The Quick a fox')).toEqual(['the', 'quick', 'fox']);
  });

  it('requires every term to be present (AND semantics)', () => {
    expect(scoreText('the quick brown fox', ['quick', 'fox'])).toBeGreaterThan(0);
    expect(scoreText('the quick brown fox', ['quick', 'cat'])).toBe(0);
  });
});

describe('searchRepo', () => {
  it('finds cards and sources, ranking title matches highly', async () => {
    const deck = await deckRepo.create({ name: 'Bio' });
    await makeCard(deck.id, 'What is mitochondria?', 'The powerhouse of the cell', ['biology']);
    await makeCard(deck.id, 'What is a ribosome?', 'Makes proteins');
    await sourceRepo.create({
      type: 'article',
      url: 'https://example.com/cell',
      title: 'Mitochondria explained',
      excerpt: 'A short note about the cell.',
      rawText: 'The mitochondria is the powerhouse of the cell.',
      contentHash: 'h1',
    });

    const results = await searchRepo.search('mitochondria');
    expect(results.cards).toHaveLength(1);
    expect(results.cards[0]?.card.front).toContain('mitochondria');
    expect(results.sources).toHaveLength(1);
    expect(results.sources[0]?.source.title).toBe('Mitochondria explained');
    expect(results.sources[0]?.snippet.length).toBeGreaterThan(0);
  });

  it('returns nothing for an empty/whitespace query', async () => {
    const results = await searchRepo.search('   ');
    expect(results.cards).toEqual([]);
    expect(results.sources).toEqual([]);
  });
});
