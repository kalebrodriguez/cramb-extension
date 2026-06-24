import type { Provider } from '@/lib/settings';
import { loadSettings } from '@/lib/settings';
import type { LLMProvider } from './types';
import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { OllamaProvider } from './ollama';

export type { LLMProvider, GenerateInput } from './types';

export async function getProvider(): Promise<LLMProvider | null> {
  const settings = await loadSettings();
  if (!settings) return null;
  return createProvider(settings.provider, settings.model);
}

export function createProvider(provider: Provider, model: string): LLMProvider {
  switch (provider) {
    case 'openai':
      return new OpenAIProvider(model);
    case 'anthropic':
      return new AnthropicProvider(model);
    case 'google':
      return new GoogleProvider(model);
    case 'ollama':
      return new OllamaProvider(model);
  }
}
