import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Cramb — Remember What You Read',
    description:
      'Turn articles and videos into spaced-repetition flashcards. Privacy-first, local-first, Anki-compatible.',
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
    action: {
      default_title: 'Cramb',
      default_icon: { 16: 'icon/16.png', 32: 'icon/32.png' },
    },
    permissions: ['activeTab', 'scripting', 'storage', 'sidePanel', 'contextMenus'],
    // Anki export compiles the sql.js WebAssembly module in the side-panel page;
    // MV3 requires 'wasm-unsafe-eval' to allow WebAssembly. Still no remote code
    // (golden rule §4) — the wasm ships in the bundle and loads same-origin.
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
    optional_host_permissions: ['<all_urls>'],
    host_permissions: [
      'https://api.openai.com/*',
      'https://api.anthropic.com/*',
      'https://generativelanguage.googleapis.com/*',
      'http://localhost:11434/*',
      'https://www.youtube.com/*',
    ],
  },
  webExt: {
    startUrls: ['https://developer.mozilla.org/en-US/docs/Web'],
  },
});
