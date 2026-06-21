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

const CaptureFromVideo = z.object({
  type: z.literal('capture.fromVideo'),
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

const DeckRename = z.object({
  type: z.literal('deck.rename'),
  payload: z.object({
    deckId: z.string().uuid(),
    name: z.string().min(1),
  }),
});

const DeckMerge = z.object({
  type: z.literal('deck.merge'),
  payload: z.object({
    sourceDeckId: z.string().uuid(),
    targetDeckId: z.string().uuid(),
  }),
});

const DeckDelete = z.object({
  type: z.literal('deck.delete'),
  payload: z.object({
    deckId: z.string().uuid(),
    deleteCards: z.boolean().default(true),
  }),
});

const CardCreate = z.object({
  type: z.literal('card.create'),
  payload: z.object({
    deckId: z.string().uuid(),
    type: z.enum(['basic', 'cloze', 'mcq']).default('basic'),
    front: z.string().min(1),
    back: z.string().min(1),
    clozeText: z.string().optional(),
    choices: z.array(z.string()).optional(),
    answerIndex: z.number().int().min(0).optional(),
    tags: z.array(z.string()).default([]),
  }),
});

const CardUpdate = z.object({
  type: z.literal('card.update'),
  payload: z.object({
    cardId: z.string().uuid(),
    changes: z.object({
      front: z.string().min(1).optional(),
      back: z.string().min(1).optional(),
      clozeText: z.string().optional(),
      choices: z.array(z.string()).optional(),
      answerIndex: z.number().int().min(0).optional(),
      tags: z.array(z.string()).optional(),
    }),
  }),
});

const CardDelete = z.object({
  type: z.literal('card.delete'),
  payload: z.object({
    cardId: z.string().uuid(),
  }),
});

const CardSuspend = z.object({
  type: z.literal('card.suspend'),
  payload: z.object({
    cardId: z.string().uuid().optional(),
    deckId: z.string().uuid().optional(),
    suspended: z.boolean(),
  }),
});

const SearchQuery = z.object({
  type: z.literal('search.query'),
  payload: z.object({
    query: z.string().min(1),
    limit: z.number().int().min(1).max(100).default(30),
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
  CaptureFromVideo,
  GenerateCards,
  CardsSave,
  ReviewNext,
  ReviewGrade,
  DeckCreate,
  DeckRename,
  DeckMerge,
  DeckDelete,
  CardCreate,
  CardUpdate,
  CardDelete,
  CardSuspend,
  SearchQuery,
  ExportAnki,
  ModelTest,
]);

export type Message = z.infer<typeof MessageSchema>;

export interface Envelope {
  id: string;
  msg: Message;
}
