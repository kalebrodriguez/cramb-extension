import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Mneme — Remember What You Read',
    description:
      'Turn articles and videos into spaced-repetition flashcards. Privacy-first, local-first, Anki-compatible.',
    permissions: ['activeTab', 'scripting', 'storage', 'sidePanel'],
    optional_host_permissions: ['<all_urls>'],
    host_permissions: [
      'https://api.openai.com/*',
      'https://api.anthropic.com/*',
      'https://generativelanguage.googleapis.com/*',
      'http://localhost:11434/*',
    ],
  },
  webExt: {
    startUrls: ['https://developer.mozilla.org/en-US/docs/Web'],
  },
});
