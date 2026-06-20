import { GenerationOutputSchema } from '@/data/schemas/generation';
import type { GeneratedCard } from '@/data/schemas/generation';
import { loadApiKey } from '@/lib/settings';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import type { LLMProvider, GenerateInput } from './types';

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

export class OpenAIProvider implements LLMProvider {
  id = 'openai';

  constructor(private model: string) {}

  async generateCards(input: GenerateInput): Promise<GeneratedCard[]> {
    const apiKey = await loadApiKey();
    if (!apiKey) throw new Error('NO_MODEL_CONFIG');

    const response = await fetch(OPENAI_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          {
            role: 'user',
            content: buildUserPrompt(input.text, input.options, input.title, input.url),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
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
      throw new Error('PROVIDER_ERROR');
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error('BAD_LLM_OUTPUT');

    const parsed = JSON.parse(content);
    const result = GenerationOutputSchema.safeParse(parsed);
    if (!result.success) throw new Error('BAD_LLM_OUTPUT');

    return result.data.cards;
  }

  async testConnection(): Promise<{ ok: boolean; detail?: string }> {
    const apiKey = await loadApiKey();
    if (!apiKey) return { ok: false, detail: 'No API key configured.' };

    try {
      const response = await fetch(OPENAI_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: 'Say "ok".' }],
          max_tokens: 5,
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
