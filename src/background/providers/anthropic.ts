import { GenerationOutputSchema } from '@/data/schemas/generation';
import type { GeneratedCard } from '@/data/schemas/generation';
import { loadApiKey } from '@/lib/settings';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import { providerError } from './http-error';
import { parseModelJson } from './json';
import { fetchWithRetry } from './fetch';
import type { LLMProvider, GenerateInput } from './types';

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

export class AnthropicProvider implements LLMProvider {
  id = 'anthropic';

  constructor(private model: string) {}

  async generateCards(input: GenerateInput): Promise<GeneratedCard[]> {
    const apiKey = await loadApiKey();
    if (!apiKey) throw new Error('NO_MODEL_CONFIG');

    const response = await fetchWithRetry(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 4096,
        system: buildSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: buildUserPrompt(input.text, input.options, input.title, input.url),
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error('INVALID_KEY');
    }
    if (response.status === 429) {
      throw new Error('RATE_LIMITED');
    }
    if (!response.ok) {
      throw await providerError(response);
    }

    const json = await response.json();
    const textBlock = json.content?.find(
      (b: { type: string }) => b.type === 'text',
    );
    if (!textBlock?.text) throw new Error('BAD_LLM_OUTPUT');

    const parsed = parseModelJson(textBlock.text);
    const result = GenerationOutputSchema.safeParse(parsed);
    if (!result.success) throw new Error('BAD_LLM_OUTPUT');

    return result.data.cards;
  }

  async testConnection(): Promise<{ ok: boolean; detail?: string }> {
    const apiKey = await loadApiKey();
    if (!apiKey) return { ok: false, detail: 'No API key configured.' };

    try {
      const response = await fetch(ANTHROPIC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say "ok".' }],
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const body = await response.text();
        return { ok: false, detail: `HTTP ${response.status}: ${body.slice(0, 200)}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, detail: e instanceof Error ? e.message : 'Unknown error' };
    }
  }
}
