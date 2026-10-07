# V2 feature options and market scan

> **Research date:** 2026-10-06
> **Scope:** Directional market scan for product discovery, not a full company valuation or pricing teardown.

## What the market says

The category has moved beyond basic "page to flashcards." Leading products now
bundle multiple content types, summaries or notes, several practice modes, and
organization features:

- Knowt's extension advertises PDF, article, lecture-video, and flashcard-site
  imports plus notes, flashcards, practice tests, and spaced repetition. Its
  Chrome listing shows roughly 200,000 users and 2,000 ratings.
- Recall combines article/video/PDF capture with summaries, notes, chat,
  automatic organization, quizzes, and spaced repetition. Its listing shows
  roughly 100,000 users and 127 ratings.
- RemNote competes on deeper learning workflows: PDF/PPT cards, image occlusion,
  exam scheduling, AI grading, notes, and an in-browser clipper.
- Readwise Reader is strongest in capture, highlighting, annotation, multi-format
  reading, and export, while its daily resurfacing loop remains a useful adjacent
  benchmark.

Public request data also points to repeated demand for richer ingestion,
organization, and review controls. Recall's public board currently contains 229
content-ingestion requests, 105 organization/tagging requests, 82 browser-extension
requests, and 41 review/quiz requests. High-vote examples include subscriptions
and bulk ingestion, native document formats, highlight-aware flashcards, bulk
topic quizzes, screenshots/images, and connecting selected web text to existing
knowledge.

## Scoring method

Each option is scored 1–5 on:

- **Value:** likely user impact.
- **Fit:** alignment with local-first capture-to-recall positioning.
- **Ease:** feasibility in the current WXT/React/Dexie architecture; 5 is easiest.
- **Policy:** Chrome Web Store and privacy safety; 5 is lowest risk.
- **Edge:** ability to differentiate rather than merely reach parity.

Scores guide discovery; they are not substitutes for user evidence.

| Option | Value | Fit | Ease | Policy | Edge | Total /25 | Notes |
|---|---:|---:|---:|---:|---:|---:|---|
| Study Mode 2.0: typed/free recall, session builder, edit/skip during review | 5 | 5 | 4 | 5 | 4 | **23** | Extends FSRS and review UI already in place; improves the core outcome directly. |
| Smart tags, filtered decks, and bulk library actions | 4 | 5 | 5 | 5 | 3 | **22** | Tags and search already exist; mostly repository/UI work with no new permission. |
| PDF/TXT/Markdown capture through a user-selected file | 5 | 5 | 3 | 5 | 3 | **21** | Strong parity feature; explicit file selection avoids broad host access. Start with text PDFs, not OCR. |
| CSV/TSV/Markdown/Anki imports and selective exports | 4 | 5 | 4 | 5 | 3 | **21** | Builds on backup and Anki export; valuable acquisition and anti-lock-in path. |
| Multilingual output and reusable generation presets | 4 | 5 | 4 | 5 | 3 | **21** | Mostly prompt/settings/schema work; useful without changing the privacy model. |
| Source summary plus attached personal notes | 4 | 4 | 4 | 5 | 2 | **19** | `Source.summary` already exists, but this risks drifting toward a generic PKM app. |
| Bring-your-own-cloud encrypted sync | 5 | 5 | 2 | 2 | 5 | **19** | Highly valuable and differentiated, but OAuth, conflict resolution, crypto, and recovery make it a separate program. |
| Screenshot OCR and image-occlusion cards | 4 | 5 | 2 | 3 | 4 | **18** | Strong student value; adds image storage, capture UX, OCR weight, and migration work. |
| Chat with one captured source | 4 | 3 | 3 | 5 | 2 | **17** | Feasible with existing provider adapters, but crowded and not the core learning differentiator. |
| Review reminders and due-card notifications | 3 | 4 | 4 | 3 | 2 | **16** | Useful retention support; introduces notification/alarms permissions and can become nagging. |
| Related-content graph / semantic resurfacing | 3 | 3 | 2 | 5 | 2 | **15** | Requires embeddings/indexing and a new mental model; better after library scale is proven. |
| Shared decks, classrooms, and leaderboards | 3 | 2 | 1 | 2 | 2 | **10** | Requires identity, backend, moderation, and privacy changes; conflicts with current no-account scope. |

## Viable build packages

### Package A — Learning depth (recommended first test)

- Typed/free-recall answers.
- Session builder: deck/tag, question count, new/review mix.
- Edit, suspend, or skip a poor card without leaving review.
- Optional answer comparison/AI feedback after the learner commits an answer.

Why it is viable: it improves Cramb's defining loop, needs no new browser
permission, and is supported by both market demand and recent work arguing that
effortful retrieval formats outperform a simple flip-and-self-rate interaction.

### Package B — Student source coverage

- Local PDF, TXT, and Markdown import.
- Page-range and card-count controls.
- Source-aware generation with page references.
- Later extension: screenshot OCR and image occlusion.

Why it is viable: PDF support is category table stakes, the source schema already
includes `pdf`, and a file picker can keep the capability explicit and local.

### Package C — Smart local library

- First-class tag CRUD and normalization.
- Filtered/smart decks based on tags, source type, due state, and creation date.
- Bulk move/tag/suspend/delete with a recoverable trash model.
- Selective Markdown/CSV export.

Why it is viable: it turns existing tags and search into a usable system without
new permissions or a backend. It is also a prerequisite for larger libraries.

### Package D — Privacy moat

- User-triggered page extraction with the smallest viable permission surface.
- Local-model presets and connection diagnostics.
- Encrypted, user-owned backup/sync as a separately validated V2.x feature.
- An inspectable "what leaves this device" screen per provider/action.

Why it is viable: competitors can match flashcard generation, but Cramb can make
privacy and ownership visible product behavior instead of passive policy text.

## Options to defer

- **General knowledge-base chat:** crowded, token-heavy, and weakly tied to
  completed review sessions.
- **Full knowledge graph:** attractive demo value but expensive to make useful
  at small library sizes.
- **Accounts, classrooms, or public sharing:** changes the architecture,
  moderation responsibilities, and privacy promise.
- **Automatic background capture or subscriptions:** valuable in larger PKM
  systems, but contrary to Cramb's explicit-capture trust model.
- **Website-specific scraping imports:** fragile and permission-heavy; prefer
  user-provided standard files and documented APIs.

## Permission implications

| Capability | Likely permission change | Safer implementation shape |
|---|---|---|
| Typed review, tags, smart decks, imports, exports, presets | None | Extension pages + IndexedDB + user-selected files |
| User-triggered page extraction | Chromium MV3 includes actively used `scripting`; Firefox MV2 does not | `activeTab` + runtime injection after a user gesture; no persistent `<all_urls>` content script or optional broad host declaration |
| Reminders | Add `alarms` and possibly `notifications` | Start with badge/due count or an opt-in reminder experiment |
| Screenshot/OCR | Capture API access and image storage review | Explicit capture action; local OCR; no background screenshots |
| Cloud sync | OAuth/identity and provider host access | BYO provider, end-to-end encryption, narrow scopes, explicit consent |

## Sources

- [Chrome minimum-permission policy](https://developer.chrome.com/docs/webstore/program-policies/user-data-faq)
- [Chrome `activeTab` guidance](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)
- [Chrome `scripting` API](https://developer.chrome.com/docs/extensions/reference/api/scripting)
- [Knowt Chrome Web Store listing](https://chromewebstore.google.com/detail/knowt-quizlet-import-ai-n/akegecpdcdbkjioddaingaedacjgfjhm)
- [Recall Chrome Web Store listing](https://chromewebstore.google.com/detail/recall-summarizer-youtube/ldbooahljamnocpaahaidnmlgfklbben)
- [Recall pricing and feature matrix](https://www.recall.it/pricing)
- [Recall public feature requests](https://feedback.recall.it/feature-requests)
- [RemNote pricing and feature matrix](https://www.remnote.com/pricing)
- [RemNote Clipper guide](https://help.remnote.com/en/articles/6030855-using-the-remnote-clipper)
- [Readwise Reader overview](https://docs.readwise.io/reader)
- [Memdora interaction-design paper](https://arxiv.org/abs/2607.25096)
