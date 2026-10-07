import { describe, expect, it, vi } from 'vitest';
import { extractPageFromTab, type PageInjectionApi } from '@/background/sources/page';

const extraction = {
  title: 'A useful article',
  byline: 'Ada Learner',
  textContent: 'Retrieval practice strengthens long-term memory.',
  siteName: 'Example',
};

describe('extractPageFromTab', () => {
  it('uses MV3 scripting and selects the main-frame result', async () => {
    const executeScript = vi.fn().mockResolvedValue([
      { frameId: 2, result: { ...extraction, title: 'iframe' } },
      { frameId: 0, result: extraction },
    ]);
    const api: PageInjectionApi = { scripting: { executeScript }, tabs: {} };

    await expect(extractPageFromTab(42, api)).resolves.toEqual(extraction);
    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ['extract-page.js'],
    });
  });

  it('falls back to Firefox MV2 tabs.executeScript', async () => {
    const executeScript = vi.fn().mockResolvedValue([extraction]);
    const api: PageInjectionApi = { tabs: { executeScript } };

    await expect(extractPageFromTab(7, api)).resolves.toEqual(extraction);
    expect(executeScript).toHaveBeenCalledWith(7, { file: '/extract-page.js' });
  });

  it('preserves a friendly error returned by the injected extractor', async () => {
    const api: PageInjectionApi = {
      scripting: {
        executeScript: vi.fn().mockResolvedValue([
          { frameId: 0, result: { error: 'No readable article text was found on this page.' } },
        ]),
      },
      tabs: {},
    };

    await expect(extractPageFromTab(1, api)).resolves.toEqual({
      error: 'No readable article text was found on this page.',
    });
  });

  it('rejects malformed extraction output', async () => {
    const api: PageInjectionApi = {
      scripting: {
        executeScript: vi.fn().mockResolvedValue([{ frameId: 0, result: { title: 'Missing text' } }]),
      },
      tabs: {},
    };

    await expect(extractPageFromTab(1, api)).resolves.toEqual({
      error: 'Failed to extract readable text from this page.',
    });
  });

  it('reports browsers without a supported injection API', async () => {
    await expect(extractPageFromTab(1, { tabs: {} })).resolves.toEqual({
      error: 'This browser does not support user-triggered page extraction.',
    });
  });
});
