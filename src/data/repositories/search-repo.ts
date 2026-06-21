import { db } from '../db';
import type { Card, Source } from '../schemas';

export interface CardSearchHit {
  kind: 'card';
  score: number;
  card: Card;
  snippet: string;
}

export interface SourceSearchHit {
  kind: 'source';
  score: number;
  source: Source;
  snippet: string;
}

export type SearchHit = CardSearchHit | SourceSearchHit;

export interface SearchResults {
  query: string;
  cards: CardSearchHit[];
  sources: SourceSearchHit[];
}

/** Split a query into lowercase terms, dropping empties and 1-char noise. */
export function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((t) => t.length >= 2);
}

/**
 * Score `text` against `terms`: every occurrence of a term adds to the score,
 * with a bonus when the term sits on a word boundary. Returns 0 if any term is
 * missing (AND semantics) so results must contain all query terms.
 */
export function scoreText(text: string, terms: string[]): number {
  if (terms.length === 0) return 0;
  const haystack = text.toLowerCase();
  let total = 0;
  for (const term of terms) {
    let occurrences = 0;
    let idx = haystack.indexOf(term);
    while (idx !== -1) {
      const onBoundary = idx === 0 || !/\p{L}|\p{N}/u.test(haystack.charAt(idx - 1));
      occurrences += onBoundary ? 2 : 1;
      idx = haystack.indexOf(term, idx + term.length);
    }
    if (occurrences === 0) return 0; // missing term → no match
    total += occurrences;
  }
  return total;
}

/** Build a short context window around the first matched term. */
export function snippet(text: string, terms: string[], radius = 60): string {
  const haystack = text.toLowerCase();
  let pos = -1;
  for (const term of terms) {
    const i = haystack.indexOf(term);
    if (i !== -1 && (pos === -1 || i < pos)) pos = i;
  }
  if (pos === -1) return text.slice(0, radius * 2).trim();
  const start = Math.max(0, pos - radius);
  const end = Math.min(text.length, pos + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

export const searchRepo = {
  /**
   * Full-text search across cards (front/back/cloze) and sources
   * (title/excerpt/rawText). Extension-scale data fits in memory, so we scan
   * rather than maintain an inverted index. Results are sorted by score desc.
   */
  async search(rawQuery: string, limit = 30): Promise<SearchResults> {
    const terms = tokenize(rawQuery);
    if (terms.length === 0) {
      return { query: rawQuery, cards: [], sources: [] };
    }

    const [cards, sources] = await Promise.all([
      db.cards.toArray(),
      db.sources.toArray(),
    ]);

    const cardHits: CardSearchHit[] = [];
    for (const card of cards) {
      const haystack = [card.front, card.back, card.clozeText ?? '', card.tags.join(' ')].join('\n');
      const score = scoreText(haystack, terms);
      if (score > 0) {
        cardHits.push({ kind: 'card', score, card, snippet: snippet(haystack, terms) });
      }
    }

    const sourceHits: SourceSearchHit[] = [];
    for (const source of sources) {
      // Title matches weigh more than body matches.
      const titleScore = scoreText(source.title, terms) * 3;
      const bodyScore = scoreText([source.excerpt, source.rawText ?? ''].join('\n'), terms);
      const score = titleScore + bodyScore;
      if (score > 0) {
        const body = source.rawText ?? source.excerpt;
        sourceHits.push({ kind: 'source', score, source, snippet: snippet(body, terms) });
      }
    }

    cardHits.sort((a, b) => b.score - a.score);
    sourceHits.sort((a, b) => b.score - a.score);

    return {
      query: rawQuery,
      cards: cardHits.slice(0, limit),
      sources: sourceHits.slice(0, limit),
    };
  },
};
