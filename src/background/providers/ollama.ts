import { GenerationOutputSchema } from '@/data/schemas/generation';
import type { GeneratedCard } from '@/data/schemas/generation';
import { loadSettings } from '@/lib/settings';
import { buildSystemPrompt, buildUserPrompt } from './prompt';
import { providerError } from './http-error';
import { parseModelJson } from './json';
import type { LLMProvider, GenerateInput } from './types';

export class OllamaProvider implements LLMProvider {
  id = 'ollama';

  constructor(private model: string) {}

  private async getEndpoint(): Promise<string> {
    const settings = await loadSettings();
    return settings?.ollamaEndpoint ?? 'http://localhost:11434';
  }

  async generateCards(input: GenerateInput): Promise<GeneratedCard[]> {
    const endpoint = await this.getEndpoint();

    const response = await fetch(`${endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: buildSystemPrompt() },
          {
            role: 'user',
            content: buildUserPrompt(input.text, input.options, input.title, input.url),
          },
        ],
        format: 'json',
        stream: false,
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      throw await providerError(response);
    }

    const json = await response.json();
    const content = json.message?.content;
    if (!content) throw new Error('BAD_LLM_OUTPUT');

    const parsed = parseModelJson(content);
    const result = GenerationOutputSchema.safeParse(parsed);
    if (!result.success) throw new Error('BAD_LLM_OUTPUT');

    return result.data.cards;
  }

  async testConnection(): Promise<{ ok: boolean; detail?: string }> {
    const endpoint = await this.getEndpoint();

    try {
      const response = await fetch(`${endpoint}/api/tags`, {
        signal: AbortSignal.timeout(5_000),
      });

      if (!response.ok) {
        return { ok: false, detail: `Ollama returned HTTP ${response.status}` };
      }

      const json = await response.json();
      const models = json.models ?? [];
      const hasModel = models.some(
        (m: { name: string }) => m.name === this.model || m.name.startsWith(`${this.model}:`),
      );

      if (!hasModel) {
        return {
          ok: true,
          detail: `Connected, but model "${this.model}" not found. Available: ${models.map((m: { name: string }) => m.name).join(', ')}`,
        };
      }
      return { ok: true };
    } catch {
      return { ok: false, detail: `Can't reach Ollama at ${endpoint} — is it running?` };
    }
  }
}
