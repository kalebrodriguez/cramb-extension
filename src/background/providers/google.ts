import { GenerationOutputSchema } from '@/data/schemas/generation';
import type { GeneratedCard } from '@/data/schemas/generation';
import { loadApiKey } from '@/lib/settings';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import type { LLMProvider, GenerateInput } from './types';

export class GoogleProvider implements LLMProvider {
  id = 'google';

  constructor(private model: string) {}

  private getUrl(apiKey: string): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${apiKey}`;
  }

  async generateCards(input: GenerateInput): Promise<GeneratedCard[]> {
    const apiKey = await loadApiKey();
    if (!apiKey) throw new Error('NO_MODEL_CONFIG');

    const response = await fetch(this.getUrl(apiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: buildSystemPrompt() }] },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: buildUserPrompt(input.text, input.options, input.title, input.url),
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
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
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('BAD_LLM_OUTPUT');

    const parsed = JSON.parse(text);
    const result = GenerationOutputSchema.safeParse(parsed);
    if (!result.success) throw new Error('BAD_LLM_OUTPUT');

    return result.data.cards;
  }

  async testConnection(): Promise<{ ok: boolean; detail?: string }> {
    const apiKey = await loadApiKey();
    if (!apiKey) return { ok: false, detail: 'No API key configured.' };

    try {
      const response = await fetch(this.getUrl(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Say "ok".' }] }],
          generationConfig: { maxOutputTokens: 5 },
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
