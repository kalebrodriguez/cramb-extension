# Cramb — Product Requirements Document (PRD)

> **Status:** Draft v0.1 · **Owner:** Kaleb · **Last updated:** 2026-06-20
> **Working name:** *Cramb* (Greek muse of memory). Easily renamed — see CLAUDE.md §Naming.

**Answers the question:** *What are we building, and why?*

---

## 1. Summary

**Cramb** is a privacy-first, open-source browser extension that turns whatever you read or watch online into spaced-repetition flashcards and quick quizzes — so the things you learn on the web actually stick.

You highlight a passage or one-click an article or YouTube video; Cramb uses an LLM (your own API key, or a local model) to generate high-quality recall cards; then it schedules them with a modern spaced-repetition algorithm so you review them at the right time. Everything is stored locally on your device by default, and you can export to Anki anytime.

**One-liner:** *Remember what you read.*

---

## 2. Problem

People consume an enormous amount of educational content online — articles, documentation, papers, lectures, video courses — and forget almost all of it. This is the classic **"forgetting curve"** problem: without active recall and spaced review, retention of newly-read material drops sharply within days.

Existing solutions each leave a gap:

- **Read-it-later apps** (Pocket, Instapaper, Readwise) save content and surface highlights, but they don't turn it into *active recall practice*, which is what actually drives retention.
- **Flashcard apps** (Anki, Mochi, Quizlet) are excellent at review but put the entire authoring burden on the user. Making good cards by hand is slow, so most people never do it.
- **AI summarizers** give you a passive summary you read once and forget — they reduce time-on-content but not forgetting.
- **AI knowledge tools** focus on storage and search ("chat with your notes"), not on making knowledge durable in *your own memory*.

The unmet need: **close the loop between consuming content and remembering it**, with near-zero authoring friction, while keeping the user's data and reading history private.

### Why now
- LLMs are now good enough to generate genuinely useful, accurate recall cards from arbitrary text.
- Users can bring their own model keys (or run local models via Ollama), removing the need for a costly central backend and the privacy concerns of sending reading history to a third-party SaaS.
- Modern, well-validated open scheduling algorithms (FSRS) exist as drop-in libraries.
- Browser extension tooling (WebExtensions + frameworks like WXT) has matured, lowering the build cost and the contributor barrier.

---

## 3. Goals & non-goals

### 3.1 Product goals
1. Make capturing a card from anything you're reading take **under 5 seconds and zero context-switching**.
2. Generate cards good enough that the median card is kept **without edits**.
3. Provide a **complete review experience** in-browser (you never *have* to leave for Anki).
4. Be **private by default** — reading history and cards live on-device; content is only sent to the model provider the user explicitly chooses.
5. Be **a great open-source project** — modular, well-documented, and easy to make a first contribution to.

### 3.2 Non-goals (for v1)
- **No hosted backend / accounts.** v1 is local-first and serverless. Cross-device cloud sync is explicitly out of scope (revisit post-launch).
- **We do not host or resell model inference.** Users bring their own key or run a local model. No bundled/shared API key.
- **Not a general note-taking or PKM app.** We don't try to replace Obsidian/Notion. (We *integrate* — e.g., Anki export.)
- **No mobile app in v1.** Browser extension only (desktop Chromium + Firefox).
- **No social / marketplace features** (shared decks, leaderboards) in v1.
- **No built-in monetization.** Project is MIT-licensed and free. Optional paid hosted sync is a *future* consideration, not a v1 goal.

---

## 4. Target users

### Primary persona — "The self-directed learner"
Reads a lot online to get better at something (a developer learning a new framework, a student supplementing coursework, a professional keeping up with their field). Motivated, comfortable installing an extension, frustrated that they forget what they read. Willing to paste in an API key or already runs Ollama.

### Secondary persona — "The student"
Studies from web articles, lecture videos, and PDFs. Already uses or has heard of Anki. Wants cards made *for* them and is happy to export to the Anki ecosystem they trust.

### Tertiary persona — "The contributor"
A developer who finds the project on GitHub, likes the privacy-first / local-first ethos, and wants to add their favorite source (e.g., a Wikipedia adapter), a new model provider, or a UI improvement. They are part of the target audience *and* the growth engine.

### Anti-persona (who this is NOT for in v1)
- Users who want a zero-config, no-API-key, fully-managed cloud experience.
- Teams/classrooms needing shared decks and admin controls.
- Mobile-only users.

---

## 5. Features

Prioritized with **MoSCoW** (Must / Should / Could / Won't-yet). The "Must" set defines v1.0.

### 5.1 Must have (v1.0)
| # | Feature | Description |
|---|---------|-------------|
| F1 | **One-click article capture** | On any article page, capture the main content (via a Readability extraction) and generate cards from it. |
| F2 | **Selection capture** | Highlight any text on any page → "Make cards from selection." |
| F3 | **LLM card generation** | Generate basic Q&A and cloze-deletion cards from captured text, with a structured, schema-validated output. |
| F4 | **Card review/edit before save** | Always show generated cards in an editable review step; user can edit, delete, or accept. |
| F5 | **Spaced-repetition review** | FSRS-scheduled review in a side panel, with Again/Hard/Good/Easy grading and keyboard shortcuts. |
| F6 | **Decks** | Organize cards into decks (auto-deck per source + user-created decks). |
| F7 | **Bring-your-own model** | Settings to choose provider (OpenAI / Anthropic / Google) + key, or a local Ollama endpoint. |
| F8 | **Local-first storage** | All cards, sources, and review history stored on-device (IndexedDB). |
| F9 | **Anki export** | Export a deck to a `.apkg` file (and/or via AnkiConnect). |
| F10 | **Onboarding** | First-run flow: pick provider, enter/validate key, make your first card. |

### 5.2 Should have (fast-follow, v1.x)
| # | Feature | Description |
|---|---------|-------------|
| F11 | **YouTube capture** | Pull a video transcript and generate cards, with timestamp links back to the moment. |
| F12 | **Quiz mode** | Multiple-choice quiz generated from a source, as a lighter-weight alternative to flashcards. |
| F13 | **Search** | Full-text search across cards and sources. |
| F14 | **Stats** | Streaks, retention estimate, reviews-due forecast. |
| F15 | **JSON import/export** | Portable backup of the whole library. |

### 5.3 Could have (later)
- PDF capture (pdf.js), EPUB import, Readwise import.
- Image-occlusion cards.
- Additional providers and local-model presets.
- Optional encrypted cloud sync (would change Non-goals).
- Tag-based smart decks.

### 5.4 Won't have (v1)
- Accounts, multi-device sync, collaboration, marketplace, mobile, telemetry-by-default.

---

## 6. User stories (representative)

- *As a learner*, I want to highlight a paragraph and get cards from it, so I can capture an insight without breaking focus.
- *As a learner*, I want to edit generated cards before they're saved, so I trust what enters my deck.
- *As a student*, I want my daily due cards in one place with fast keyboard grading, so reviewing is quick.
- *As a privacy-conscious user*, I want to use my own API key or a local model and keep my data on my machine, so my reading history isn't sent to a SaaS.
- *As an Anki user*, I want to export decks to `.apkg`, so I'm never locked in.
- *As a contributor*, I want a documented "adapter" interface, so I can add a new content source in an afternoon.

---

## 7. Success metrics

Because v1 is local-first with **no telemetry by default**, we measure success through *opt-in* signals, public OSS signals, and structured user research — never silent tracking.

### 7.1 North-star metric
**Weekly Active Reviewers (WAR):** the number of people who complete at least one review session in a week. Retention is the product's entire reason to exist, so *reviewing* (not just capturing) is the truest signal of value.

### 7.2 Supporting product metrics (opt-in analytics only)
| Metric | Target (6 months post-launch) | Why it matters |
|--------|-------------------------------|----------------|
| Card acceptance rate (kept ÷ generated) | ≥ 70% | Proxy for generation quality. |
| Capture → first review conversion | ≥ 50% | Are people closing the loop, not just hoarding? |
| Day-7 / Day-30 retention of installers | ≥ 30% / ≥ 15% | Habit formation. |
| Median time-to-first-card after install | ≤ 3 min | Onboarding effectiveness. |
| Review session completion rate | ≥ 80% | Is the review UX painless? |

### 7.3 Open-source health metrics
| Metric | Target (6 months) | Why |
|--------|-------------------|-----|
| GitHub stars | 1,000+ | Awareness / credibility. |
| Distinct external contributors | 15+ | The actual goal: a project others contribute to. |
| Merged community PRs | 40+ | Contribution velocity. |
| "Good first issue" median time-to-first-response | ≤ 48h | Maintainer responsiveness = contributor retention. |
| Source adapters contributed by community | 5+ | Validates the modular architecture. |

### 7.4 Guardrail metrics (don't regress)
- Generation cost per capture stays modest (token budget respected).
- p95 generation latency ≤ 8s for a typical article.
- Zero incidents of the user's API key or content leaving the device to anywhere other than the chosen provider.

---

## 8. Key assumptions & risks

| Assumption / risk | Mitigation |
|-------------------|------------|
| Users will tolerate bringing their own API key. | Make Ollama (free/local) a first-class path; make key setup a 60-second guided step; clearly explain *why* (privacy + no markup). |
| LLM-generated cards are good enough to keep. | Always-editable review step; prompt engineering + few-shot examples; per-source card-count limits; quality evals in CI. |
| The "learn from browsing" niche isn't already owned. | Validate against existing tools before launch (see Implementation Plan §0). Differentiators: local-first, BYO-model, review *in-browser*, Anki-compatible, OSS. |
| Manifest V3 constraints block something. | Architecture designed MV3-native from day one (see TRD). |
| Maintainer bandwidth limits contributor growth. | Invest early in CONTRIBUTING docs, labeled good-first-issues, and a clean adapter interface. |

---

## 9. Open questions
1. Default provider/model recommendation for best quality-per-cost? (Decide during M1 evals.)
2. Should auto-decks be per-source or per-domain by default? (Lean: per-source, with a "merge into deck" action.)
3. How aggressive should the default daily new-card limit be to avoid overwhelm? (Lean: 20/day, configurable.)
4. Anki export via file (`.apkg`) vs. AnkiConnect — ship which first? (Lean: `.apkg` first; no dependency on a running Anki.)

---

## 10. Appendix — competitive framing (one-liners)
- **Readwise/Pocket:** great capture & resurfacing of *highlights*, but passive — no generated recall practice.
- **Anki/Mochi:** great review, but manual authoring.
- **AI summarizers / "chat with page":** reduce reading time, not forgetting.
- **Cramb:** capture → *auto-generate recall cards* → spaced review, local-first and Anki-compatible.
