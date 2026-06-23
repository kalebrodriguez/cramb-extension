import initSqlJs, { type SqlJsStatic } from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import type { Card, Deck } from '@/data/schemas';
import { buildApkg } from './apkg';

// sql.js is ~1MB of wasm; load it once, lazily, and reuse. The wasm ships in the
// bundle and is served from the extension origin (no remote code — golden rule §4).
let sqlPromise: Promise<SqlJsStatic> | null = null;
function getSql(): Promise<SqlJsStatic> {
  return (sqlPromise ??= initSqlJs({ locateFile: () => wasmUrl }));
}

function slugify(name: string): string {
  return name.replace(/[^\w- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 60) || 'cramb';
}

function triggerDownload(bytes: Uint8Array, filename: string): void {
  // Copy into a plain ArrayBuffer so the Blob part type is unambiguous.
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([buffer], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Build a `.apkg` from the given decks + cards and download it. */
export async function downloadApkg(decks: Deck[], cards: Card[], baseName: string): Promise<void> {
  const SQL = await getSql();
  const bytes = await buildApkg(decks, cards, SQL);
  triggerDownload(bytes, `${slugify(baseName)}.apkg`);
}
