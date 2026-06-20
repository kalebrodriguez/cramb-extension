# CLAUDE.md — AI Development Context for Mneme

> Read this first, every session. It tells you (the AI assistant) how to think while building Mneme.
> Keep it **current**: when architecture, status, or rules change, update this file in the same PR.

**Answers the question:** *How should the AI think while building this?*

---

## 1. What we're building (one paragraph)
**Mneme** is a privacy-first, open-source **browser extension** that turns what the user reads or watches online into **spaced-repetition flashcards and quizzes**, so they actually remember it. The user highlights text or one-clicks an article/video; an LLM (the user's **own** key, or local **Ollama**) generates editable cards; the user reviews them on an **FSRS** schedule. Everything is **local-first** (IndexedDB) and **Anki-compatible** (export). No backend, no accounts in v1.

**Tagline:** *Remember what you read.*
**Full specs live in `docs/`** — PRD, App-Flow, UI/UX Design System, Backend Schema, TRD, Implementation Plan. When in doubt, those documents win; if you change behavior, update them.

---

## 2. Golden rules — NEVER violate these
These are hard invariants. If a task seems to require breaking one, **stop and flag it** instead.

1. **Never ship or hardcode an API key.** No bundled/shared keys, ever. The user brings their own.
2. **The API key is read ONLY in the background service worker.** Never pass it to a content script or page context. Never log it. Never put it in IndexedDB or any export.
3. **Never send user content anywhere except the provider the user explicitly chose.** No analytics-by-default, no third-party calls, no "phone home." Egress is HTTPS only (or `localhost` for Ollama).
4. **No remote code.** MV3-compliant: everything ships in the bundle. No `eval`, no remote `<script>`, no dynamic code loading.
5. **Generated cards are ALWAYS shown for edit before saving.** Never auto-commit model output to a deck.
6. **Treat all LLM output and page HTML as untrusted.** Validate model JSON with Zod; sanitize HTML with DOMPurify; render markdown through the restricted renderer.
7. **Never reference raw hex/spacing in components.** Use design tokens (CSS vars / Tailwind theme) from `03-UI-UX-Design-System.md`.
8. **Never bypass the repository layer.** UI and SW touch data only through typed repositories, never Dexie directly.
9. **Respect `prefers-reduced-motion` and keyboard a11y** in every new UI.
10. **Don't add a dependency casually.** Justify it; prefer the small, audited option; pin the version; run `pnpm audit`.

---

## 3. Tech stack (authoritative — keep versions pinned here)
- **Language:** TypeScript, `strict: true`. No `any` (use `unknown` + narrowing).
- **Extension framework:** WXT (MV3, Vite, cross-browser).
- **UI:** React 18 + Tailwind CSS; **Zustand** for state.
- **Data:** IndexedDB via **Dexie**; settings + secret in `chrome.storage.local`.
- **Scheduling:** `ts-fsrs`.
- **Extraction/render:** `@mozilla/readability`, `markdown-it` (restricted), **DOMPurify**.
- **Validation:** **Zod** at every boundary.
- **LLM:** provider adapters over `fetch` (OpenAI / Anthropic / Google / Ollama) with structured output.
- **Export:** `.apkg` via `sql.js` (wasm); optional AnkiConnect.
- **Tests:** Vitest (unit/contract/eval) + Playwright (e2e).
- **Tooling:** pnpm, ESLint, Prettier, GitHub Actions.

> Pinned versions: _fill in at project init and update on every bump._

---

## 4. Folder structure (where things go)
```
src/
  background/   service worker: message hub, generation, scheduler, providers/
  content/      extractor + capture toolbar (shadow-DOM React root)
  ui/           popup/ side-panel/ options/ onboarding/ + components/
  data/         dexie db, repositories, migrations, zod schemas
  lib/          message types, errors, tokens, shared utils
  styles/       tailwind + token CSS
tests/          vitest + playwright
docs/           the 6 product/eng docs
```
- New **content source**? → `background/` source adapter + `content/` extractor hook. Self-contained.
- New **model provider**? → `background/providers/<name>.ts` implementing `LLMProvider`. Self-contained.
- New **UI component**? → `ui/components/`, token-driven, with a11y + states.

---

## 5. Coding standards
- **Functional React** components + hooks; no class components.
- **Naming:** `camelCase` vars/functions, `PascalCase` components/types, `SCREAMING_SNAKE` const enums of error codes. Files: `kebab-case.ts`, components `PascalCase.tsx`.
- **Errors:** return typed `Result<T>` across the message boundary; map to canonical error codes (Backend-Schema §5); never throw raw across surfaces. Surface friendly copy, never stack traces, to users.
- **Async:** always handle rejection paths; add timeouts to network calls; backoff on 429.
- **Comments:** explain *why*, not *what*. Keep functions small and pure where possible.
- **No secrets/content in logs.** Logging sits behind a debug flag and redacts.
- **Tests required** for scheduler logic, repositories, adapters, and schema validation. New UI ships with at least a smoke test.

---

## 6. Design principles (how it should feel)
- **Local-first & private.** The default answer to "where does this data go?" is *nowhere but the user's device (and their chosen model)*.
- **Capture in ≤ 5 seconds, zero context switch.** Friction kills the loop.
- **The card is the hero.** Calm, focused, one primary action per surface. Dark mode is default.
- **Trust through editability.** The user always sees and controls what enters their deck.
- **Encouraging, never nagging.** Positive, concise copy (see Design System §1.3).
- **Keyboard-first review.** Power users review fast without the mouse.

---

## 7. Current status (UPDATE EACH SESSION)
- **Phase:** M0 complete — project scaffolded, building, tests passing.
- **What's done:** WXT + React + Tailwind v4 scaffold; Dexie DB + repository layer; Zod schemas for all entities + messages + LLM output; all 4 provider adapters (OpenAI, Anthropic, Google, Ollama); background SW message hub; popup, options (provider/key form + test connection), side panel; content script with shadow-DOM capture toolbar; CI workflow; 15 unit tests (schemas + repositories); repo hygiene (LICENSE, README, CONTRIBUTING, CODE_OF_CONDUCT, .editorconfig).
- **Next action:** Milestone 0 remaining — validate the niche (`docs/research.md`), confirm/lock name + availability. Then Milestone 1 — wire end-to-end capture → generate → save flow.
- **Last updated:** 2026-06-20.

### Changelog of context
- 2026-06-20 — Initial product + engineering docs written; stack and architecture chosen.
- 2026-06-20 — M0 scaffold complete. WXT 0.20.26, React 19, Tailwind v4, Dexie 4, Zod 4, ts-fsrs 5.4, TypeScript 6. Build succeeds for Chromium. 15 tests pass.

---

## 8. Known issues / watchpoints
- **Tailwind v4 migration:** Using CSS-first `@theme` config instead of `tailwind.config.ts`. The JS config file is kept for reference but `@theme` in `global.css` is the active source.
- **WXT entrypoints:** Files must live in `src/entrypoints/` with WXT naming conventions (not custom `src/ui/` paths). Imports use `wxt/utils/define-background` etc. (not the deprecated `wxt/sandbox`).
- **Firefox build:** Not yet tested (`pnpm build:firefox`). Expect `sidePanel` → sidebar API differences.
- **Watch:** confirm `ts-fsrs` API surface when wiring M2 review engine; verify each provider's structured-output mechanism during M1 integration testing.

---

## 9. Naming
Working name is **Mneme** (Greek muse of memory; *NEE-mee*). It is **not yet trademark/availability-checked** — verify npm + store + domain in M0. To rename, find-replace `Mneme`/`mneme` across `docs/`, `README`, manifest, and this file. Alternatives considered: *Encore*, *Synap*.

---

## 10. How to work in this repo (for the AI)
1. **Start from the docs.** Match `docs/` specs; if reality diverges, update the doc in the same PR.
2. **Stay inside module boundaries.** Prefer adapters over edits to core.
3. **Security first.** Re-read §2 before anything touching keys, egress, storage, or rendering.
4. **Small, reviewable PRs** with tests and updated docs. One concern per PR.
5. **When unsure, flag it** in the PR description rather than guessing on a golden-rule-adjacent decision.
6. **Keep §7 current** so the next session (human or AI) knows exactly where things stand.
```
Quick commands (fill in once scaffolded):
  pnpm dev            # run extension in dev (HMR)
  pnpm build          # production build (Chromium + Firefox)
  pnpm test           # vitest
  pnpm test:e2e       # playwright
  pnpm lint && pnpm typecheck
```
