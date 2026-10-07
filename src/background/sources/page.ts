import { z } from 'zod';
import { browser } from 'wxt/browser';

export const PageExtractionSchema = z.object({
  title: z.string().optional(),
  byline: z.string().optional(),
  textContent: z.string().trim().min(1),
  siteName: z.string().optional(),
});

export type PageExtraction = z.infer<typeof PageExtractionSchema>;
export type PageExtractionResult = PageExtraction | { error: string };

interface InjectionResult {
  frameId?: number;
  result?: unknown;
}

export interface PageInjectionApi {
  scripting?: {
    executeScript: (details: {
      target: { tabId: number };
      files: string[];
    }) => Promise<InjectionResult[]>;
  };
  tabs: {
    executeScript?: (
      tabId: number,
      details: { file: string },
    ) => Promise<unknown[] | undefined>;
  };
}

function errorFrom(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object' || !('error' in raw)) return null;
  const error = (raw as { error?: unknown }).error;
  return typeof error === 'string' && error.trim() ? error : null;
}

/**
 * Run the bundled page extractor only after the user invokes capture.
 * Chrome MV3 uses `scripting.executeScript`; Firefox MV2 falls back to the
 * older `tabs.executeScript` API. Neither path needs a persistent content
 * script registered on every page.
 */
export async function extractPageFromTab(
  tabId: number,
  api: PageInjectionApi = browser as unknown as PageInjectionApi,
): Promise<PageExtractionResult> {
  try {
    let raw: unknown;

    if (api.scripting?.executeScript) {
      const results = await api.scripting.executeScript({
        target: { tabId },
        files: ['extract-page.js'],
      });
      raw = results.find((entry) => entry.frameId === 0)?.result ?? results[0]?.result;
    } else if (api.tabs.executeScript) {
      const results = await api.tabs.executeScript(tabId, { file: '/extract-page.js' });
      raw = results?.[0];
    } else {
      return { error: 'This browser does not support user-triggered page extraction.' };
    }

    const pageError = errorFrom(raw);
    if (pageError) return { error: pageError };

    const parsed = PageExtractionSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: 'Failed to extract readable text from this page.' };
    }

    return parsed.data;
  } catch (error) {
    return { error: `Page extraction failed: ${String(error)}` };
  }
}
