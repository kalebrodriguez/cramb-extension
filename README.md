# ✦ Cramb

**Remember what you read.**

Cramb is a privacy-first, open-source browser extension that turns what you read or watch online into spaced-repetition flashcards — so the things you learn actually stick.

## How it works

1. **Capture** — Highlight text, one-click an article, or grab a YouTube video's transcript while browsing.
2. **Generate** — An LLM (your own API key or local Ollama) creates editable flashcards. You always review and edit before anything is saved.
3. **Review** — Cards are scheduled with FSRS so you review at the right time, right in your browser — keyboard-first (`Space` to reveal, `1`–`4` to grade).

## Features

- **Capture** articles, selections, and YouTube transcripts
- **Card types:** basic, cloze, and multiple-choice (MCQ)
- **Manage** decks and cards: rename, merge, delete, suspend, hand-author
- **Full-text search** across your cards and sources
- **Stats:** review streak, retention estimate, and a 7-day due forecast
- **No lock-in:** export any deck to **Anki** (`.apkg`), or export/import your whole library as JSON
- **Themes:** dark, light, and system

Everything stays on your device. See **[Privacy](#privacy)** below.

## Install

Cramb isn't on the Chrome Web Store or Firefox AMO yet. For now, build it from
source and load it as an unpacked extension.

**Prerequisites:** [Node.js](https://nodejs.org) 20+ and [pnpm](https://pnpm.io) 9+.

```bash
pnpm install      # install dependencies
pnpm build        # produces .output/chrome-mv3
```

Then, in Chrome, go to `chrome://extensions`, enable **Developer mode**, click
**Load unpacked**, and select the `.output/chrome-mv3` directory.

For **Firefox**, run `pnpm build:firefox` and load `.output/firefox-mv2` via
`about:debugging`. Firefox opens the workspace in the **sidebar** (rather than
Chrome's side panel); cross-browser support is newer and less battle-tested, so
please report anything that misbehaves.

### Set up a model

Cramb needs access to an LLM to generate cards. You bring your own:

- **OpenAI** / **Anthropic** / **Google** — paste your API key in Settings
- **Ollama** — run a local model at `localhost:11434` (free, fully private)

## Development

```bash
pnpm dev          # launches Chromium with the extension loaded, with HMR
pnpm dev:firefox  # same, in Firefox
pnpm test         # vitest unit tests
pnpm test:e2e     # playwright accessibility (axe) gate — needs `pnpm build` first
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
pnpm build        # production build → .output/chrome-mv3
pnpm build:firefox # production build → .output/firefox-mv2
```

`pnpm dev` opens a fresh browser window with Cramb already loaded and hot-reloads
on changes — no manual "load unpacked" step needed while developing.

## Privacy

Cramb is local-first with **no backend and no accounts**. Your reading and your
cards live in your browser's IndexedDB. Your API key is read only in the
background service worker — it is never logged, never stored in your library, and
never included in exports. Cramb talks **only** to the model provider you choose
(or your local Ollama) — no analytics, no telemetry, no third-party calls.

Full details: **[privacy policy](https://kalebrodriguez.github.io/cramb-extension/privacy.html)** ·
how to report a vulnerability: **[SECURITY.md](SECURITY.md)**.

## Tech stack

TypeScript (strict) · WXT (MV3) · React 19 · Tailwind v4 · Zustand · Dexie (IndexedDB) · ts-fsrs · Zod · Vitest · Playwright (axe a11y)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. We welcome PRs for new content source adapters, model providers, and UI improvements.

## License

[MIT](LICENSE)
