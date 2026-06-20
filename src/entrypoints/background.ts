import { defineBackground } from 'wxt/utils/define-background';
import { MessageSchema } from '@/lib/messages';
import { ok, err, type Result } from '@/lib/errors';
import { getProvider } from '@/background/providers';

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
    handleMessage(raw).then(sendResponse);
    return true;
  });

  async function handleMessage(raw: unknown): Promise<Result<unknown>> {
    const parsed = MessageSchema.safeParse(raw);
    if (!parsed.success) {
      return err('UNKNOWN', `Invalid message: ${parsed.error.message}`);
    }

    const msg = parsed.data;

    switch (msg.type) {
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
