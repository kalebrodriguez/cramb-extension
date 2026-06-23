import type { Provider } from './settings';

/** UI-facing provider list (labels + ordering). */
export const PROVIDERS: { id: Provider; label: string }[] = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'google', label: 'Google' },
  { id: 'ollama', label: 'Ollama (local)' },
];

/**
 * Sensible default model per provider. Kept here (not inline) so the options
 * page and the onboarding wizard can never drift to a stale model id —
 * verified current as of 2026-06.
 */
export const DEFAULT_MODELS: Record<Provider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-sonnet-4-6',
  google: 'gemini-2.0-flash',
  ollama: 'llama3.2',
};

/** Where the user gets a key for each cloud provider (shown in onboarding). */
export const KEY_HELP: Partial<Record<Provider, { label: string; url: string }>> = {
  openai: { label: 'platform.openai.com', url: 'https://platform.openai.com/api-keys' },
  anthropic: { label: 'console.anthropic.com', url: 'https://console.anthropic.com/settings/keys' },
  google: { label: 'aistudio.google.com', url: 'https://aistudio.google.com/apikey' },
};
