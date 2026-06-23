// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { unzipSync, strFromU8 } from 'fflate';
import path from 'node:path';
import { buildApkg } from '@/lib/anki/apkg';
import { BASIC_MODEL_ID, CLOZE_MODEL_ID } from '@/lib/anki/schema';
import type { Card, Deck } from '@/data/schemas';

let SQL: SqlJsStatic;

beforeAll(async () => {
  SQL = await initSqlJs({
    locateFile: (f) => path.join(process.cwd(), 'node_modules/sql.js/dist', f),
  });
});

function deck(p: Partial<Deck>): Deck {
  return {
    id: crypto.randomUUID(),
    name: 'Deck',
    color: 'violet',
    newPerDay: 20,
    reviewsPerDay: 200,
    createdAt: 0,
    updatedAt: 0,
    ...p,
  };
}

function card(p: Partial<Card>): Card {
  return {
    id: crypto.randomUUID(),
    deckId: 'd',
    type: 'basic',
    front: 'front',
    back: 'back',
    tags: [],
    suspended: false,
    due: 0,
    stability: 0,
    difficulty: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    createdAt: 0,
    updatedAt: 0,
    ...p,
  };
}

/** Open the collection.anki2 out of a built apkg and return the sql.js Database. */
function openCollection(bytes: Uint8Array) {
  const files = unzipSync(bytes);
  const media = files['media'];
  const collection = files['collection.anki2'];
  if (!media || !collection) throw new Error('apkg missing expected entries');
  expect(strFromU8(media)).toBe('{}');
  return new SQL.Database(collection);
}

function scalar(db: import('sql.js').Database, sql: string): unknown {
  return db.exec(sql)[0]?.values[0]?.[0];
}

describe('buildApkg', () => {
  it('produces a valid collection with notes, cards, and both models', async () => {
    const d = deck({ id: 'deck1', name: 'Bio' });
    const cards = [
      card({ deckId: 'deck1', type: 'basic', front: 'Q1', back: 'A1' }),
      card({
        deckId: 'deck1',
        type: 'cloze',
        front: 'x',
        back: 'extra',
        clozeText: 'The {{c1::mitochondria}} is the powerhouse',
      }),
    ];

    const db = openCollection(await buildApkg([d], cards, SQL));
    try {
      expect(scalar(db, 'SELECT count(*) FROM notes')).toBe(2);
      expect(scalar(db, 'SELECT count(*) FROM cards')).toBe(2);

      const models = JSON.parse(scalar(db, 'SELECT models FROM col') as string);
      expect(models[String(BASIC_MODEL_ID)]).toBeDefined();
      expect(models[String(CLOZE_MODEL_ID)]).toBeDefined();

      const decks = JSON.parse(scalar(db, 'SELECT decks FROM col') as string);
      expect(Object.values(decks).map((x) => (x as { name: string }).name)).toContain('Bio');
    } finally {
      db.close();
    }
  });

  it('maps cloze cards to the cloze model with markers preserved', async () => {
    const cards = [
      card({ deckId: 'd1', type: 'cloze', clozeText: 'A {{c1::B}} C', back: 'note' }),
    ];
    const db = openCollection(await buildApkg([deck({ id: 'd1' })], cards, SQL));
    try {
      const flds = scalar(db, `SELECT flds FROM notes WHERE mid=${CLOZE_MODEL_ID}`) as string;
      expect(flds).toContain('{{c1::B}}');
    } finally {
      db.close();
    }
  });

  it('folds mcq choices into a Basic note', async () => {
    const cards = [
      card({ deckId: 'd1', type: 'mcq', front: 'Pick one', back: 'Two', choices: ['One', 'Two', 'Three'], answerIndex: 1 }),
    ];
    const db = openCollection(await buildApkg([deck({ id: 'd1' })], cards, SQL));
    try {
      const flds = scalar(db, `SELECT flds FROM notes WHERE mid=${BASIC_MODEL_ID}`) as string;
      expect(flds).toContain('Pick one');
      expect(flds).toContain('A. One');
      expect(flds).toContain('B. Two');
    } finally {
      db.close();
    }
  });

  it('exports cards as new (queue 0) under the mapped deck', async () => {
    const d = deck({ id: 'deck1', name: 'Mapped' });
    const db = openCollection(await buildApkg([d], [card({ deckId: 'deck1' })], SQL));
    try {
      expect(scalar(db, 'SELECT queue FROM cards')).toBe(0);
      expect(scalar(db, 'SELECT type FROM cards')).toBe(0);
      // did points at the mapped deck (not Default = 1).
      expect(scalar(db, 'SELECT did FROM cards')).not.toBe(1);
    } finally {
      db.close();
    }
  });
});
