# Cramb — Implementation Plan

> **Status:** Draft v0.1 · **Last updated:** 2026-06-20

**Answers the question:** *What do we build first?*

> Cadence assumes a solo maintainer + occasional contributors, ~1-week "sprints."
> Adjust freely. Each milestone has **exit criteria** — don't advance until they're met.

---

## Milestone 0 — Foundations & validation (Sprint 1)

**Goal:** a building, testable, empty extension + a confirmed reason to build it.

- [ ] **Validate the niche (do this first, ~half a day).** Search GitHub/web for existing "browse → flashcard," "AI Anki generator," and extension competitors. Note overlaps and confirm the wedge (local-first, BYO-model, in-browser review, Anki-compatible, OSS). Record findings in `docs/research.md`. *Kill/rename/pivot decision happens here.*
- [ ] Lock the name + check npm/store/domain availability; create the GitHub repo.
- [ ] Scaffold with WXT + TypeScript (strict) + React + Tailwind; wire design tokens.
- [ ] Repo hygiene: `LICENSE` (MIT), `README`, `CONTRIBUTING`, `CODE_OF_CONDUCT`, `.editorconfig`, issue/PR templates, `CLAUDE.md`.
- [ ] CI: lint + typecheck + test + build (Chromium & Firefox) on every PR.
- [ ] Dexie schema + repository layer + migrations skeleton; Zod message types.
- [ ] Options page: provider/key form + `model.test` round-trip to one provider.
- [ ] "Hello card": hardcoded text → one provider call → schema-valid cards logged.

**Exit criteria:** PR CI green; a real provider call returns schema-valid cards; key stored only in `chrome.storage.local` and never exposed to a content script (verified).

---

## Milestone 1 — Core capture → generate → save (Sprints 2–3) · **v0.1 (internal)**

**Goal:** the core loop works end-to-end for articles. This is the "would I use it?" moment.

- [x] Content script: Readability extraction + DOMPurify; selection capture.
- [x] In-page capture toolbar (shadow-DOM) on selection + popup "Capture this page."
- [x] Generation orchestrator: chunking, card cap, schema validation, one repair retry.
- [x] Side panel: generated-card list with edit/delete/accept + deck picker.
- [x] Persist sources + cards via repositories; auto-deck per source.
- [x] Error states: `NO_MODEL_CONFIG`, `INVALID_KEY`, `RATE_LIMITED`, `EXTRACTION_EMPTY`.

**Exit criteria:** From a real article, a user can capture, see editable cards, and save them to a deck — with all four error states handled gracefully.

---

## Milestone 2 — Review engine (Sprint 4) · **v0.2**

**Goal:** close the loop — the part that actually creates retention.

- [x] Integrate `ts-fsrs`; scheduler wrapper; persist FSRS state on each grade.
- [x] Side-panel review UI: front/reveal/back, rating bar with next-interval labels.
- [x] Keyboard-first review (`Space`, `1–4`); daily new/review limits.
- [x] Review logging (`reviews` table); session summary screen + empty "all caught up" state.

**Exit criteria:** A user can review due cards with keyboard, grades reschedule correctly per FSRS, and limits are respected. Scheduler unit tests pass.

---

## Milestone 3 — Sources & management (Sprint 5)

**Goal:** breadth + the management surfaces real use requires.

- [x] YouTube transcript adapter → cards with timestamp deep-links. *(background adapter + `capture.fromVideo`; transcript segments stored on source for deep-links)*
- [x] Manual card creation; deck management (rename/merge/delete/suspend). *(repo + message layer + side-panel management UI: Decks view, deck detail, manual cards)*
- [x] Full-text search across cards + sources. *(`searchRepo` + `search.query`)*
- [x] Quiz (MCQ) generation mode. *(prompt + Zod refinement; opt-in via `cardTypes`)*

**Exit criteria:** YouTube capture works (with no-transcript fallback); decks/cards are fully manageable; search returns relevant results.

---

## Milestone 4 — Interop & insight (Sprint 6)

**Goal:** no lock-in + light motivation.

- [x] Anki `.apkg` export (basic + cloze mapping); JSON export/import. *(sql.js + fflate; per-deck ⤓ Anki button; cards export as new. JSON backup in Options.)*
- [ ] Optional AnkiConnect path (detected, not required). *(deferred — `.apkg` export covers the interop need for now)*
- [x] Stats: streak, due forecast, retention estimate (incremental aggregation). *(Home summary; pure `lib/stats.ts`)*

**Exit criteria:** A deck round-trips to Anki and imports cleanly; JSON backup restores full library; stats render from real review data.

---

## Milestone 5 — Polish & public launch (Sprints 7–8) · **v1.0**

**Goal:** ship to stores and open the doors to contributors.

- [ ] Onboarding wizard (provider/key/Ollama, validation, first-card demo).
- [ ] Empty states, skeleton loaders, toasts, full a11y pass (keyboard, SR, contrast, reduced-motion).
- [ ] Theme polish (dark default + light); responsive at 320px.
- [ ] Hardening: backoff, quota-pressure handling, storage-persist request, error taxonomy complete.
- [ ] Store assets: icons, screenshots, listing copy, **privacy policy**, permissions justifications.
- [ ] Submit to **Chrome Web Store** + **Firefox AMO**.
- [ ] Contributor on-ramp: 15–20 labeled `good first issue`s (new provider, new source adapter, new export target, UI polish), an **adapter authoring guide**, and a docs pass.
- [ ] Tag `v1.0.0`; GitHub Release; announce.

**Exit criteria:** Installable from both stores; onboarding gets a new user to first card ≤ 3 min; a11y checks pass; ≥ 15 good-first-issues open with clear acceptance criteria.

---

## Development order (the critical path)

```
Scaffold + provider call (M0)
   → Capture + extract (M1)
      → Generate + editable save (M1)
         → FSRS review (M2)   ← earliest point the product is genuinely useful
            → Sources/management (M3)
               → Export/stats (M4)
                  → Onboarding + a11y + store (M5)
```
Rationale: prove the **generate→save** loop before investing in review UI; ship **review** before breadth; defer interop/polish until the core delights you (the first user).

---

## Testing strategy

| Layer | Tooling | What |
|-------|---------|------|
| Unit | Vitest | Scheduler math, repositories, extraction normalization, provider adapters (with mocked transport), Zod schemas, `.apkg` mapping. |
| Contract | Vitest | One contract test per provider adapter against recorded fixtures (record/replay) → resilient to API drift, no token spend in CI. |
| Generation eval | Vitest | Run generation over a fixture corpus with a **mocked provider**; assert schema validity, card-count bounds, cloze integrity. |
| E2E | Playwright | Load the unpacked extension; capture from a fixture page → edit → save → review → grade; export to `.apkg`. Run on Chromium + Firefox. |
| Manual matrix | Checklist | Chrome, Edge, Brave, Firefox; real OpenAI/Anthropic/Google/Ollama smoke tests pre-release. |
| A11y | axe + token contrast check | Automated in CI; manual keyboard/SR pass at M5. |

**Definition of Done (per PR):** code + tests + docs updated; CI green; no secret/content logging; user-facing strings reviewed; a11y for any new UI.

---

## Launch checklist (v1.0)

**Product**
- [ ] Onboarding validated with 3–5 fresh users (time-to-first-card measured).
- [ ] All App-Flow §7 edge cases handled.
- [ ] Dark/light themes pass contrast; full keyboard operability.

**Store submission**
- [ ] Icons (16/32/48/128), screenshots, demo GIF.
- [ ] Listing copy + privacy policy URL.
- [ ] Per-permission justification text (activeTab, scripting, storage, sidePanel, host).
- [ ] Chrome Web Store developer account; Firefox AMO account.

**Repo / OSS**
- [ ] README (what/why, install, BYO-key setup, screenshots, contributing link).
- [ ] CONTRIBUTING + adapter authoring guide + architecture doc links.
- [ ] CODE_OF_CONDUCT, SECURITY.md (how to report), issue/PR templates.
- [ ] 15–20 labeled `good first issue`s with acceptance criteria.
- [ ] Semantic-versioning + release workflow; `CHANGELOG.md`.
- [ ] License headers / SPDX where appropriate.

**Engineering**
- [ ] CI green on main; bundle-size budget enforced.
- [ ] `pnpm audit` clean; Dependabot on; lockfile committed.
- [ ] No secret in exports/logs (audited).
- [ ] Crash/error paths verified (provider down, rate-limited, no transcript, empty page).

---

## Post-launch backlog (candidate, prioritize by feedback)
PDF/EPUB capture · Readwise import · image-occlusion cards · more providers/local presets · tag-based smart decks · cross-device **sync** (see below) · Safari port · i18n.

### Multi-device sync (post-v1) — keep the privacy promise

The most common "I wish it had accounts" request is really just **sync** ("my cards on my phone *and* laptop") + cloud backup. We can deliver that **without** becoming a data custodian. Do **not** build a plain backend that stores readable user content — that breaks the local-first wedge, the "we can't read your data" pitch, and golden rules §2–3, and saddles a solo maintainer with infra, cost, and breach liability.

Privacy-preserving options, cheapest first:

- **A — Bring-your-own-cloud (recommended first step).** Sync the existing JSON library export to the *user's own* Google Drive / Dropbox / file-sync folder. Cramb never sees the data; there's no Cramb server to run. Builds directly on the M4 `data/backup.ts` export/import. Lowest cost, fully on-brand. Add a "sync to your cloud" paragraph to the privacy policy when shipped.
- **B — End-to-end encrypted sync.** A server stores only ciphertext it can't decrypt (à la Bitwarden / Obsidian Sync / Standard Notes). Preserves the privacy promise but requires running infra — reserve for a paid tier if real demand appears.
- **C — Plain backend + accounts that store readable content.** ❌ Rejected: contradicts the product's identity and non-goals.

Sequence: ship local-first v1 → if multi-device demand is real, do **A** → consider **B** only as a paid tier later.

---

## Contributor growth plan (the actual point of the project)
1. Land the **adapter interfaces** (provider + source) early and document them — most external PRs will be adapters.
2. Maintain a healthy `good first issue` queue; respond within ~48h.
3. Each merged adapter gets a shout-out in the README/CHANGELOG (recognition retains contributors).
4. Keep `CLAUDE.md` current so AI-assisted contributors produce in-house-style code on the first try.
