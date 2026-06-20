import { z } from 'zod';

export const GenOptionsSchema = z.object({
  maxCards: z.number().int().min(1).max(20).default(8),
  cardTypes: z.array(z.enum(['basic', 'cloze', 'mcq'])).default(['basic', 'cloze']),
});
export type GenOptions = z.infer<typeof GenOptionsSchema>;

const CaptureFromSelection = z.object({
  type: z.literal('capture.fromSelection'),
  payload: z.object({
    text: z.string().min(1),
    url: z.string().url(),
    title: z.string(),
  }),
});

const CaptureFromPage = z.object({
  type: z.literal('capture.fromPage'),
  payload: z.object({
    url: z.string().url(),
  }),
});

const GenerateCards = z.object({
  type: z.literal('generate.cards'),
  payload: z.object({
    sourceId: z.string().uuid(),
    options: GenOptionsSchema,
  }),
});

const CardsSave = z.object({
  type: z.literal('cards.save'),
  payload: z.object({
    deckId: z.string().uuid(),
    cards: z.array(z.unknown()),
  }),
});

const ReviewNext = z.object({
  type: z.literal('review.next'),
  payload: z.object({
    deckId: z.string().uuid().optional(),
  }),
});

const ReviewGrade = z.object({
  type: z.literal('review.grade'),
  payload: z.object({
    cardId: z.string().uuid(),
    rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    durationMs: z.number().int().min(0),
  }),
});

const DeckCreate = z.object({
  type: z.literal('deck.create'),
  payload: z.object({
    name: z.string().min(1),
  }),
});

const ExportAnki = z.object({
  type: z.literal('export.anki'),
  payload: z.object({
    deckId: z.string().uuid(),
  }),
});

const ModelTest = z.object({
  type: z.literal('model.test'),
  payload: z.object({}),
});

export const MessageSchema = z.discriminatedUnion('type', [
  CaptureFromSelection,
  CaptureFromPage,
  GenerateCards,
  CardsSave,
  ReviewNext,
  ReviewGrade,
  DeckCreate,
  ExportAnki,
  ModelTest,
]);

export type Message = z.infer<typeof MessageSchema>;

export interface Envelope {
  id: string;
  msg: Message;
}
