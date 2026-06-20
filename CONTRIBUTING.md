# Contributing to Mneme

Thanks for your interest in contributing! Mneme is designed to be easy to contribute to.

## Getting started

1. Fork the repo and clone your fork
2. `pnpm install`
3. `pnpm dev` to run the extension in dev mode
4. Make your changes on a feature branch
5. Run `pnpm lint && pnpm typecheck && pnpm test` before submitting

## What to work on

Check the [Issues](https://github.com/kalebrodriguez/mneme/issues) tab for `good first issue` labels. The easiest contributions are:

- **New model provider** — add a file in `src/background/providers/` implementing `LLMProvider`
- **New content source adapter** — add extraction logic in `src/content/`
- **UI improvements** — components live in `src/ui/components/`

## Code standards

- TypeScript strict mode, no `any`
- Functional React components + hooks
- Use design tokens (CSS vars / Tailwind theme), never raw hex
- All data access through the repository layer (`src/data/repositories/`)
- Zod validation at every boundary
- Tests required for repositories, adapters, and schema validation

## PR guidelines

- One concern per PR
- Include tests for new logic
- Update docs if behavior changes
- Keep PRs small and reviewable

## Architecture

See [CLAUDE.md](CLAUDE.md) §4 for folder structure and module boundaries. The key principle: the background service worker is the "backend" — it holds secrets, talks to providers, and owns data writes. UI surfaces are thin clients that message the SW.

## Code of conduct

Be kind, be constructive. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
