# ✦ Cramb

**Remember what you read.**

Cramb is a privacy-first, open-source browser extension that turns what you read or watch online into spaced-repetition flashcards — so the things you learn actually stick.

## How it works

1. **Capture** — Highlight text, one-click an article, or grab a YouTube video's transcript while browsing.
2. **Generate** — An LLM (your own API key or local Ollama) creates editable flashcards.
3. **Review** — Cards are scheduled with FSRS so you review at the right time, right in your browser.

Everything stays on your device. Anki-compatible by design — export is coming in v0.4.

## Install

Cramb isn't on the Chrome Web Store or Firefox AMO yet. For now, build it from
source and load it as an unpacked extension.

**Prerequisites:** [Node.js](https://nodejs.org) 20+ and [pnpm](https://pnpm.io) 9+.

```bash
pnpm install      # install dependencies
pnpm build        # produces .output/chrome-mv3
```

Then, in Chrome, go to `chrome://extensions`, enable **Developer mode**, click
**Load unpacked**, and select the `.output/chrome-mv3` directory. (For Firefox,
run `pnpm build:firefox` and load `.output/firefox-mv2` via `about:debugging`.)

### Set up a model

Cramb needs access to an LLM to generate cards. You bring your own:

- **OpenAI** / **Anthropic** / **Google** — paste your API key in Settings
- **Ollama** — run a local model at `localhost:11434` (free, fully private)

## Development

```bash
pnpm dev          # launches Chromium with the extension loaded, with HMR
pnpm dev:firefox  # same, in Firefox
pnpm test         # vitest unit tests
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
pnpm build        # production build (Chromium + Firefox)
```

`pnpm dev` opens a fresh browser window with Cramb already loaded and hot-reloads
on changes — no manual "load unpacked" step needed while developing.

## Tech stack

TypeScript (strict) · WXT (MV3) · React 19 · Tailwind v4 · Zustand · Dexie (IndexedDB) · ts-fsrs · Zod · Vitest · Playwright

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. We welcome PRs for new content source adapters, model providers, and UI improvements.

## License

[MIT](LICENSE)
