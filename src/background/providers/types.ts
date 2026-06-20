import type { GeneratedCard } from '@/data/schemas/generation';
import type { GenOptions } from '@/lib/messages';

export interface GenerateInput {
  text: string;
  title?: string;
  url?: string;
  options: GenOptions;
}

export interface LLMProvider {
  id: string;
  generateCards(input: GenerateInput): Promise<GeneratedCard[]>;
  testConnection(): Promise<{ ok: boolean; detail?: string }>;
}
