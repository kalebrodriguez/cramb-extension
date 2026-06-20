import { defineBackground } from 'wxt/utils/define-background';
import { MessageSchema } from '@/lib/messages';
import { ok, err, type Result } from '@/lib/errors';
import { getProvider } from '@/background/providers';

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
          const extraction: any = await chrome.tabs.sendMessage(tabId, { type: 'extractPage' });
          
          if (!extraction || extraction.error) {
            return err('EXTRACTION_EMPTY', extraction?.error || 'Failed to extract content from page.');
          }

          const { title, byline, content, textContent } = extraction;

          if (!textContent || textContent.trim().length === 0) {
            return err('EXTRACTION_EMPTY', 'No text content could be extracted from this page.');
          }
          
          // Generate a safe source name/deck name
          const sourceName = title || new URL(msg.payload.url).hostname || 'Unknown Source';

          // First hash the content to ensure it's unique
          const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(textContent))
            .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

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
          
          return ok(source);

        } catch (e) {
          return err('UNKNOWN', `Capture failed: ${String(e)}`);
        }
      }

      case 'capture.fromSelection': {
        const { sourceRepo, deckRepo } = await import('@/data/repositories');
        
        const sourceName = msg.payload.title || new URL(msg.payload.url).hostname || 'Unknown Source';
        
        // Hash the content
        const contentHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(msg.payload.text))
            .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));

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
        let deckId = existingDecks.find(d => d.name === sourceName)?.id;
        
        if (!deckId) {
            await deckRepo.create({ name: sourceName, sourceId: source.id });
        }
        
        return ok(source);
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

      case 'generate.cards': {
        const provider = await getProvider();
        if (!provider) return err('NO_MODEL_CONFIG', 'No model configured.');
        try {
          const { sourceRepo } = await import('@/data/repositories');
          const source = await sourceRepo.getById(msg.payload.sourceId);
          if (!source?.rawText) return err('EXTRACTION_EMPTY', 'No content found for this source.');

          const cards = await provider.generateCards({
            text: source.rawText,
            title: source.title,
            url: source.url,
            options: msg.payload.options,
          });
          return ok(cards);
        } catch (e) {
          const code = e instanceof Error ? e.message : 'UNKNOWN';
          return err(code as never, `Generation failed: ${code}`);
        }
      }

      default:
        return err('UNKNOWN', `Unhandled message type: ${msg.type}`);
    }
  }
});
