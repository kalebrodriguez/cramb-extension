import { defineBackground } from 'wxt/utils/define-background';
import { MessageSchema } from '@/lib/messages';
import { ok, err, type Result } from '@/lib/errors';
import { getProvider } from '@/background/providers';

/** SHA-256 hex digest of a string, used to de-duplicate captured content. */
async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((raw, sender, sendResponse) => {
    handleMessage(raw, sender).then(sendResponse);
    return true;
  });

  async function handleMessage(raw: unknown, sender: chrome.runtime.MessageSender): Promise<Result<unknown>> {
    const parsed = MessageSchema.safeParse(raw);
    if (!parsed.success) {
      return err('UNKNOWN', `Invalid message: ${parsed.error.message}`);
    }

    const msg = parsed.data;

    switch (msg.type) {
      case 'capture.fromPage': {
        const { sourceRepo, deckRepo } = await import('@/data/repositories');
        
        let tabId = sender.tab?.id;
        
        // If not sent from a content script (e.g. from popup), we need to find the active tab
        if (!tabId) {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          tabId = tabs[0]?.id;
        }
        
        if (!tabId) {
           return err('EXTRACTION_EMPTY', 'Could not find active tab to capture.');
        }
        
        try {
          // Ask the content script to extract the page
          const extraction: unknown = await chrome.tabs.sendMessage(tabId, { type: 'extractPage' }).catch(err => {
            return { error: String(err) };
          });
          
          if (!extraction || typeof extraction !== 'object' || 'error' in extraction) {
            const errObj = extraction as { error?: string };
            return err('EXTRACTION_EMPTY', errObj?.error || 'Failed to extract content from page.');
          }

          const { title, byline, textContent } = extraction as { title?: string, byline?: string, textContent?: string };

          if (!textContent || textContent.trim().length === 0) {
            return err('EXTRACTION_EMPTY', 'No text content could be extracted from this page.');
          }
          
          // Generate a safe source name/deck name
          const sourceName = title || new URL(msg.payload.url).hostname || 'Unknown Source';

          // First hash the content to ensure it's unique
          const contentHash = await sha256Hex(textContent);

          const source = await sourceRepo.create({
            type: 'article',
            url: msg.payload.url,
            title: sourceName,
            rawText: textContent,
            excerpt: textContent.substring(0, 150) + '...',
            author: byline || undefined,
            contentHash
          });

          // Ensure a deck exists for this source
          const existingDecks = await deckRepo.listAll();
          let deckId = existingDecks.find(d => d.name === sourceName)?.id;
          
          if (!deckId) {
             const newDeck = await deckRepo.create({ name: sourceName, sourceId: source.id });
             deckId = newDeck.id;
          }
          
          // Let the side panel know that capture is complete
          await chrome.storage.local.set({ activeCaptureSourceId: source.id });
          chrome.runtime.sendMessage({ type: 'CAPTURE_COMPLETE', sourceId: source.id }).catch(() => {});

          return ok(source);

        } catch (e) {
          return err('UNKNOWN', `Capture failed: ${String(e)}`);
        }
      }

      case 'capture.fromSelection': {
        const { sourceRepo, deckRepo } = await import('@/data/repositories');
        
        const sourceName = msg.payload.title || new URL(msg.payload.url).hostname || 'Unknown Source';
        
        // Hash the content
        const contentHash = await sha256Hex(msg.payload.text);

        const source = await sourceRepo.create({
            type: 'selection',
            url: msg.payload.url,
            title: sourceName + ' (Selection)',
            rawText: msg.payload.text,
            excerpt: msg.payload.text.substring(0, 150) + '...',
            contentHash
        });

        // Ensure a deck exists for this source
        const existingDecks = await deckRepo.listAll();
        const deckId = existingDecks.find(d => d.name === sourceName)?.id;
        
        if (!deckId) {
            await deckRepo.create({ name: sourceName, sourceId: source.id });
        }
        
        // Let the side panel know that capture is complete
        await chrome.storage.local.set({ activeCaptureSourceId: source.id });
        chrome.runtime.sendMessage({ type: 'CAPTURE_COMPLETE', sourceId: source.id }).catch(() => {});

        return ok(source);
      }

      case 'capture.fromVideo': {
        const { sourceRepo, deckRepo } = await import('@/data/repositories');
        const { fetchTranscript, NoTranscriptError } = await import('@/background/sources/youtube');

        try {
          const transcript = await fetchTranscript(msg.payload.url);

          const contentHash = await sha256Hex(transcript.fullText);
          const source = await sourceRepo.create({
            type: 'video',
            url: msg.payload.url,
            title: transcript.title,
            author: transcript.author,
            siteName: 'YouTube',
            rawText: transcript.fullText,
            excerpt: transcript.fullText.substring(0, 150) + '…',
            segments: transcript.segments,
            contentHash,
          });

          const existingDecks = await deckRepo.listAll();
          if (!existingDecks.find((d) => d.name === transcript.title)) {
            await deckRepo.create({ name: transcript.title, sourceId: source.id });
          }

          await chrome.storage.local.set({ activeCaptureSourceId: source.id });
          chrome.runtime.sendMessage({ type: 'CAPTURE_COMPLETE', sourceId: source.id }).catch(() => {});

          return ok(source);
        } catch (e) {
          if (e instanceof NoTranscriptError) {
            return err('EXTRACTION_EMPTY', e.message);
          }
          return err('UNKNOWN', `Video capture failed: ${String(e)}`);
        }
      }

      case 'deck.rename': {
        const { deckRepo } = await import('@/data/repositories');
        const deck = await deckRepo.getById(msg.payload.deckId);
        if (!deck) return err('UNKNOWN', 'Deck not found.');
        await deckRepo.update(msg.payload.deckId, { name: msg.payload.name });
        return ok({ id: msg.payload.deckId, name: msg.payload.name });
      }

      case 'deck.merge': {
        const { deckRepo } = await import('@/data/repositories');
        try {
          const moved = await deckRepo.merge(msg.payload.sourceDeckId, msg.payload.targetDeckId);
          return ok({ moved });
        } catch (e) {
          return err('UNKNOWN', `Merge failed: ${String(e)}`);
        }
      }

      case 'deck.delete': {
        const { deckRepo } = await import('@/data/repositories');
        if (msg.payload.deleteCards) {
          const removed = await deckRepo.deleteWithCards(msg.payload.deckId);
          return ok({ deletedCards: removed });
        }
        await deckRepo.delete(msg.payload.deckId);
        return ok({ deletedCards: 0 });
      }

      case 'card.create': {
        const { cardRepo } = await import('@/data/repositories');
        try {
          const card = await cardRepo.create({
            deckId: msg.payload.deckId,
            type: msg.payload.type,
            front: msg.payload.front,
            back: msg.payload.back,
            clozeText: msg.payload.clozeText,
            choices: msg.payload.choices,
            answerIndex: msg.payload.answerIndex,
            tags: msg.payload.tags,
            suspended: false,
          });
          return ok(card);
        } catch (e) {
          return err('UNKNOWN', `Failed to create card: ${String(e)}`);
        }
      }

      case 'card.update': {
        const { cardRepo } = await import('@/data/repositories');
        const card = await cardRepo.getById(msg.payload.cardId);
        if (!card) return err('UNKNOWN', 'Card not found.');
        await cardRepo.update(msg.payload.cardId, msg.payload.changes);
        return ok({ id: msg.payload.cardId });
      }

      case 'card.delete': {
        const { cardRepo } = await import('@/data/repositories');
        await cardRepo.delete(msg.payload.cardId);
        return ok({ id: msg.payload.cardId });
      }

      case 'card.suspend': {
        const { cardRepo } = await import('@/data/repositories');
        if (msg.payload.cardId) {
          await cardRepo.setSuspended(msg.payload.cardId, msg.payload.suspended);
          return ok({ count: 1 });
        }
        if (msg.payload.deckId) {
          const count = await cardRepo.setSuspendedByDeck(msg.payload.deckId, msg.payload.suspended);
          return ok({ count });
        }
        return err('UNKNOWN', 'card.suspend requires a cardId or deckId.');
      }

      case 'search.query': {
        const { searchRepo } = await import('@/data/repositories');
        const results = await searchRepo.search(msg.payload.query, msg.payload.limit);
        return ok(results);
      }

      case 'model.test': {
        const provider = await getProvider();
        if (!provider) return err('NO_MODEL_CONFIG', 'No model configured.');
        const result = await provider.testConnection();
        return result.ok
          ? ok({ status: 'connected' })
          : err('INVALID_KEY', result.detail ?? 'Connection failed.');
      }

      case 'deck.create': {
        const { deckRepo } = await import('@/data/repositories');
        const deck = await deckRepo.create({ name: msg.payload.name });
        return ok(deck);
      }

      case 'review.next': {
        const { cardRepo } = await import('@/data/repositories');
        try {
          const cards = await cardRepo.getDue(msg.payload.deckId, 50);
          return ok({ cards });
        } catch (e) {
          return err('UNKNOWN', `Failed to fetch due cards: ${String(e)}`);
        }
      }

      case 'review.grade': {
        const { cardRepo, reviewRepo } = await import('@/data/repositories');
        const { scheduleCard } = await import('@/lib/scheduler');
        try {
          const card = await cardRepo.getById(msg.payload.cardId);
          if (!card) return err('UNKNOWN', 'Card not found');

          // Ensure rating is strongly typed to ts-fsrs Rating
          const rating = msg.payload.rating as 1 | 2 | 3 | 4;
          
          // Calculate next state
          const nextState = scheduleCard(card, rating);
          
          // Apply changes to card
          await cardRepo.update(card.id, nextState);
          
          // Log review
          await reviewRepo.create({
            id: crypto.randomUUID(),
            cardId: card.id,
            rating,
            durationMs: msg.payload.durationMs,
            prevState: card.state,
            ts: Date.now(),
            scheduledDays: Math.floor(((nextState.due || Date.now()) - Date.now()) / 86400000),
            elapsedDays: card.lastReview ? Math.floor((Date.now() - card.lastReview) / 86400000) : 0,
          });

          return ok({ success: true });
        } catch (e) {
          return err('UNKNOWN', `Grading failed: ${String(e)}`);
        }
      }

      case 'cards.save': {
        const { cardRepo } = await import('@/data/repositories');
        
        try {
          const cardsToCreate = msg.payload.cards.map((c: unknown) => {
             const card = c as {
                type?: string;
                front: string;
                back: string;
                clozeText?: string;
                choices?: string[];
                answerIndex?: number;
                tags?: string[];
             };
             return {
               deckId: msg.payload.deckId,
               type: (card.type || 'basic') as "basic" | "cloze" | "mcq",
               front: card.front,
               back: card.back,
               clozeText: card.clozeText,
               choices: card.choices,
               answerIndex: card.answerIndex,
               tags: card.tags || [],
               suspended: false
             };
          });

          for (const card of cardsToCreate) {
             await cardRepo.create(card);
          }
          return ok({ count: cardsToCreate.length });
        } catch(e) {
           return err('UNKNOWN', `Failed to save cards: ${String(e)}`);
        }
      }
      case 'generate.cards': {
        const provider = await getProvider();
        if (!provider) return err('NO_MODEL_CONFIG', 'No model configured.');
        try {
          const { sourceRepo } = await import('@/data/repositories');
          const source = await sourceRepo.getById(msg.payload.sourceId);
          if (!source?.rawText) return err('EXTRACTION_EMPTY', 'No content found for this source.');

          // Simple chunking logic if text is too large
          // A naive assumption: 1 token ~= 4 characters. We don't want to exceed context limits,
          // so chunk rawText into pieces of ~10,000 characters if it's very large.
          const maxCharLimit = 10000;
          let textToProcess = source.rawText;
          if (textToProcess.length > maxCharLimit) {
            console.warn(`Text length ${textToProcess.length} exceeds limits, chunking...`);
            // We just take the first chunk for now in M1 to simplify,
            // later we could process in parallel and map-reduce.
            textToProcess = textToProcess.substring(0, maxCharLimit);
          }

          const cards = await provider.generateCards({
            text: textToProcess,
            title: source.title,
            url: source.url,
            options: msg.payload.options,
          });
          return ok(cards);
        } catch (e) {
          const message = e instanceof Error ? e.message : 'UNKNOWN';
          // Map to RATE_LIMITED if error implies quota or rate limiting
          if (message.toLowerCase().includes('rate limit') || message.includes('429')) {
            return err('RATE_LIMITED', `Generation failed due to rate limits: ${message}`);
          }
          return err('UNKNOWN', `Generation failed: ${message}`);
        }
      }

      case 'library.export': {
        const { backup } = await import('@/data/backup');
        try {
          return ok(await backup.export());
        } catch (e) {
          return err('UNKNOWN', `Export failed: ${String(e)}`);
        }
      }

      case 'library.import': {
        const { backup } = await import('@/data/backup');
        try {
          const counts = await backup.import(msg.payload.backup);
          return ok(counts);
        } catch (e) {
          return err('UNKNOWN', e instanceof Error ? e.message : 'Invalid backup file.');
        }
      }

      default:
        return err('UNKNOWN', `Unhandled message type: ${msg.type}`);
    }
  }
});
