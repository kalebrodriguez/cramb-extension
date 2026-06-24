import { defineConfig } from '@playwright/test';

/**
 * E2E config — currently just the accessibility (axe) gate. Runs against the
 * built chrome-mv3 extension loaded into a real Chromium, because contrast
 * checks need computed styles a DOM-only runner can't provide.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    trace: 'on-first-retry',
  },
});
