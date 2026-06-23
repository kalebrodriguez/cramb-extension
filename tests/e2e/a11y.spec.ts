import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

const PAGES = ['popup', 'sidepanel', 'options', 'onboarding'] as const;
const THEMES = ['dark', 'light'] as const;

async function analyze(page: Page) {
  return new AxeBuilder({ page })
    // WCAG 2.1 A/AA is the bar we hold for v1 (the M5 exit criterion).
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
}

for (const name of PAGES) {
  for (const theme of THEMES) {
    test(`${name} has no a11y violations (${theme})`, async ({ page, extensionId }) => {
      await page.goto(`chrome-extension://${extensionId}/${name}.html`);
      // Force the theme under test and wait for the app to render.
      await page.evaluate((t) => {
        document.documentElement.dataset.theme = t;
      }, theme);
      await page.locator('#root').waitFor({ state: 'attached' });
      await expect(page.locator('#root')).not.toBeEmpty();

      const results = await analyze(page);

      // Surface a readable, node-level summary when something fails.
      const summary = results.violations.flatMap((v) =>
        v.nodes.map(
          (n) =>
            `${v.id} (${v.impact}) @ ${n.target.join(' ')}\n    ${n.failureSummary?.replace(/\n/g, '\n    ')}`,
        ),
      );
      expect(summary, '\n' + summary.join('\n\n')).toEqual([]);
    });
  }
}
