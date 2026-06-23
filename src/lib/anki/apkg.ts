import type { SqlJsStatic } from 'sql.js';
import { zipSync, strToU8 } from 'fflate';
import type { Card, Deck } from '@/data/schemas';
import {
  APKG_SCHEMA,
  BASIC_MODEL_ID,
  CLOZE_MODEL_ID,
  DEFAULT_CONF,
  DEFAULT_DCONF,
  buildDeck,
  buildModels,
} from './schema';

const FIELD_SEP = '\x1f'; // Anki joins note fields with the unit separator.

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

/** Anki field checksum: first 8 hex digits of SHA-1 of the stripped first field. */
async function fieldChecksum(field0: string): Promise<number> {
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(stripHtml(field0)));
  const hex = Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return parseInt(hex.slice(0, 8), 16);
}

/** Anki stores tags space-joined with a leading and trailing space; empty -> "". */
function formatTags(tags: string[]): string {
  return tags.length ? ` ${tags.join(' ')} ` : '';
}

interface AnkiNote {
  mid: number;
  fields: string[];
  tags: string[];
  guid: string;
}

/** Map a Cramb card to an Anki note (Basic or Cloze). */
function toNote(card: Card): AnkiNote {
  if (card.type === 'cloze') {
    const text =
      card.clozeText && card.clozeText.includes('{{c') ? card.clozeText : `{{c1::${card.front}}}`;
    return { mid: CLOZE_MODEL_ID, fields: [text, card.back], tags: card.tags, guid: card.id };
  }
  if (card.type === 'mcq' && card.choices?.length) {
    const options = card.choices
      .map((c, i) => `${String.fromCharCode(65 + i)}. ${c}`)
      .join('\n');
    return { mid: BASIC_MODEL_ID, fields: [`${card.front}\n\n${options}`, card.back], tags: card.tags, guid: card.id };
  }
  return { mid: BASIC_MODEL_ID, fields: [card.front, card.back], tags: card.tags, guid: card.id };
}

/**
 * Build a `.apkg` from Cramb decks + cards. Cards are exported as **new** Anki
 * cards (FSRS scheduling isn't mapped onto Anki's scheduler). `SQL` is an
 * initialized sql.js module — injected so this stays testable in Node and
 * environment-agnostic (the caller wires the wasm location).
 */
export async function buildApkg(decks: Deck[], cards: Card[], SQL: SqlJsStatic): Promise<Uint8Array> {
  const now = Date.now();
  const nowSec = Math.floor(now / 1000);

  const db = new SQL.Database();
  try {
    db.run(APKG_SCHEMA);

    // Map each Cramb deck to a unique Anki deck id; keep Anki's Default (1).
    const deckIdFor = new Map<string, number>();
    const ankiDecks: Record<string, unknown> = { '1': buildDeck(1, 'Default', nowSec) };
    decks.forEach((deck, i) => {
      const id = now + i + 1;
      deckIdFor.set(deck.id, id);
      ankiDecks[String(id)] = buildDeck(id, deck.name || 'Cramb', nowSec);
    });

    const models = buildModels(nowSec);

    db.run('INSERT INTO col VALUES (1, ?, ?, ?, 11, 0, 0, 0, ?, ?, ?, ?, ?)', [
      nowSec,
      now,
      now,
      JSON.stringify(DEFAULT_CONF),
      JSON.stringify(models),
      JSON.stringify(ankiDecks),
      JSON.stringify(DEFAULT_DCONF),
      '{}',
    ]);

    const noteStmt = db.prepare('INSERT INTO notes VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    const cardStmt = db.prepare('INSERT INTO cards VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');

    let position = 0;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (!card) continue;
      const note = toNote(card);
      const noteId = now + i;
      const cardId = now + 1_000_000 + i;
      const did = deckIdFor.get(card.deckId) ?? 1;

      noteStmt.run([
        noteId,
        note.guid,
        note.mid,
        nowSec,
        -1,
        formatTags(note.tags),
        note.fields.join(FIELD_SEP),
        stripHtml(note.fields[0] ?? ''),
        await fieldChecksum(note.fields[0] ?? ''),
        0,
        '',
      ]);

      cardStmt.run([
        cardId,
        noteId,
        did,
        0, // ord (template 0 / cloze c1)
        nowSec,
        -1,
        0, // type: new
        0, // queue: new
        position++, // due (new-card position)
        0, // ivl
        0, // factor
        0, // reps
        0, // lapses
        0, // left
        0, // odue
        0, // odid
        0, // flags
        '',
      ]);
    }

    noteStmt.free();
    cardStmt.free();

    const collectionBytes = db.export();
    return zipSync({ 'collection.anki2': collectionBytes, media: strToU8('{}') });
  } finally {
    db.close();
  }
}
