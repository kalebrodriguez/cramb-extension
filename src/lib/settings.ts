import { z } from 'zod';

export const ProviderSchema = z.enum(['openai', 'anthropic', 'google', 'ollama']);
export type Provider = z.infer<typeof ProviderSchema>;

export const SettingsSchema = z.object({
  provider: ProviderSchema,
  model: z.string(),
  ollamaEndpoint: z.string().default('http://localhost:11434'),
  generation: z.object({
    maxCardsPerCapture: z.number().int().min(1).max(20).default(8),
    cardTypes: z.array(z.enum(['basic', 'cloze', 'mcq'])).default(['basic', 'cloze']),
    cardContentFont: z.enum(['sans', 'serif']).default('sans'),
  }),
  review: z.object({
    newPerDay: z.number().int().min(0).default(20),
    reviewsPerDay: z.number().int().min(0).default(200),
  }),
  appearance: z.object({
    theme: z.enum(['dark', 'light', 'system']).default('dark'),
  }),
  privacy: z.object({
    analyticsOptIn: z.boolean().default(false),
  }),
});

export type Settings = z.infer<typeof SettingsSchema>;

const SETTINGS_KEY = 'mneme.settings';
const SECRET_KEY = 'mneme.secret.apiKey';

export async function loadSettings(): Promise<Settings | null> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  const raw = result[SETTINGS_KEY];
  if (!raw) return null;
  const parsed = SettingsSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function loadApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(SECRET_KEY);
  return (result[SECRET_KEY] as string) ?? null;
}

export async function saveApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ [SECRET_KEY]: key });
}

export async function clearApiKey(): Promise<void> {
  await chrome.storage.local.remove(SECRET_KEY);
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  ollamaEndpoint: 'http://localhost:11434',
  generation: {
    maxCardsPerCapture: 8,
    cardTypes: ['basic', 'cloze'],
    cardContentFont: 'sans',
  },
  review: {
    newPerDay: 20,
    reviewsPerDay: 200,
  },
  appearance: {
    theme: 'dark',
  },
  privacy: {
    analyticsOptIn: false,
  },
};
