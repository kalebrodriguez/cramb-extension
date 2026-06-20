# ✦ Mneme

**Remember what you read.**

Mneme is a privacy-first, open-source browser extension that turns what you read or watch online into spaced-repetition flashcards — so the things you learn actually stick.

## How it works

1. **Capture** — Highlight text or one-click an article while browsing.
2. **Generate** — An LLM (your own API key or local Ollama) creates editable flashcards.
3. **Review** — Cards are scheduled with FSRS so you review at the right time, right in your browser.

Everything stays on your device. Export to Anki anytime.

## Quick start

```bash
pnpm install
pnpm dev          # run in Chromium with HMR
pnpm dev:firefox  # run in Firefox
```

### Set up a model

Mneme needs access to an LLM to generate cards. You bring your own:

- **OpenAI** / **Anthropic** / **Google** — paste your API key in Settings
- **Ollama** — run a local model at `localhost:11434` (free, fully private)

## Development

```bash
pnpm test         # vitest unit tests
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
pnpm build        # production build (Chromium + Firefox)
```

## Tech stack

TypeScript (strict) · WXT (MV3) · React 18 · Tailwind CSS · Zustand · Dexie (IndexedDB) · ts-fsrs · Zod · Vitest · Playwright

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. We welcome PRs for new content source adapters, model providers, and UI improvements.

## License

[MIT](LICENSE)
