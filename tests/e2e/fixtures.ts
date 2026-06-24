import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.join(dir, '../../.output/chrome-mv3');

/**
 * Loads the built MV3 extension into a persistent Chromium context and exposes
 * its runtime id, so specs can navigate to chrome-extension://<id>/<page>.html.
 * `channel: 'chromium'` uses the new headless mode, which (unlike the headless
 * shell) supports loading extensions.
 */
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');
    const extensionId = sw.url().split('/')[2];
    if (!extensionId) throw new Error('Could not resolve extension id from service worker URL');
    await use(extensionId);
  },
});

export const expect = test.expect;
