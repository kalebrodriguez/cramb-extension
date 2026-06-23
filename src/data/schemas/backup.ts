import { z } from 'zod';
import { DeckSchema } from './deck';
import { CardSchema } from './card';
import { SourceSchema } from './source';
import { ReviewSchema } from './review';

/** Current backup format version. Bump when the shape changes incompatibly. */
export const BACKUP_VERSION = 1;

/**
 * A full, self-contained snapshot of the user's library: every deck, card,
 * source, and review. Round-trips losslessly so a JSON file can restore the
 * whole library on another device. Contains no API keys or settings (keys live
 * only in chrome.storage and are never exported — golden rule §2).
 */
export const BackupSchema = z.object({
  app: z.literal('cramb'),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.number(),
  decks: z.array(DeckSchema),
  cards: z.array(CardSchema),
  sources: z.array(SourceSchema),
  reviews: z.array(ReviewSchema),
});

export type Backup = z.infer<typeof BackupSchema>;
