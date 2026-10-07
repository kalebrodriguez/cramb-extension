# Cramb V2 discovery scaffold

> **Status:** Discovery — capture-permission spike complete; no V2 feature set is approved yet
> **Created:** 2026-10-06
> **Goal:** Choose a coherent V2 that increases completed review sessions without weakening Cramb's local-first privacy promise.

This directory is the planning boundary for V2. The only implementation so far
is the store-safety capture spike; no user-facing V2 feature has entered
delivery. A feature moves into delivery only after its user outcome, data
migration, permission impact, and validation test are documented.

## Product outcome

The V2 north star remains **Weekly Active Reviewers**: people who complete at
least one review session in a week. Capture volume is useful only when it leads
to durable learning.

Candidate supporting outcomes:

- Raise capture-to-first-review conversion.
- Raise the share of generated cards users keep after editing.
- Shorten the time from opening a source to starting useful recall practice.
- Keep the install-time permission surface no broader than the feature requires.

## Recommended shape

V2 should deepen Cramb's existing advantage—capture to active recall—rather
than turn the extension into a general cloud knowledge-management product.

The strongest release shape to validate is:

1. **Trust foundation:** keep the manifest, store copy, and runtime behavior in
   sync. Page extraction now uses user-triggered `activeTab` + `scripting`
   injection on Chromium and the MV2 equivalent on Firefox.
2. **Study Mode 2.0:** typed/free-recall answers, configurable study sessions,
   and edit/skip controls during review.
3. **Smart local library:** tag management, filtered/smart decks, and bulk card
   actions using the data Cramb already stores.
4. **Source expansion:** user-selected PDF/TXT/Markdown ingestion, designed to
   avoid broad browsing permissions.

This is a recommendation for validation, not an implementation commitment. See
[feature-options.md](feature-options.md) for alternatives and scoring.

## Delivery scaffold

### Stage 0 — Store-safe baseline

- [x] Confirm the packaged manifest matches every permission justification.
- [x] Remove the redundant optional `<all_urls>` declaration.
- [x] Replace the statically registered `<all_urls>` content script with an
  on-demand packaged extractor. Chromium MV3 actively uses `scripting` after the
  capture gesture; Firefox MV2 uses `tabs.executeScript` without declaring it.
- Resubmit only after Chrome and Firefox artifacts pass the existing CI sequence.

### Stage 1 — Discovery spikes

Each spike must answer one uncertain question without shipping user-visible
production behavior:

| Spike | Question | Deliverable |
|---|---|---|
| Capture permission model | **Resolved:** extraction runs only after an explicit user action and both browser builds pass. | Prototype, tests, packaged-manifest diff, and accepted D-003 |
| Typed recall | Can users answer and self-grade quickly enough inside the side panel? | Clickable UI prototype + five-user task test |
| Local PDF ingestion | Can useful text be extracted from common PDFs without a backend? | Fixture benchmark across text, multi-column, and scanned PDFs |
| Smart library | Are tags and filtered decks more useful than improving source-level decks? | Prototype tested against real libraries |

### Stage 2 — Vertical slices

Build one end-to-end slice at a time. A slice includes schema/message changes,
repository methods, UI, tests, docs, and permission justification updates.

Suggested order if discovery validates the recommended shape:

1. Permission/capture hardening.
2. Typed/free-recall review and session controls.
3. Tag management and filtered decks.
4. File ingestion beginning with text PDFs, TXT, and Markdown.
5. Import/export expansion and multilingual generation presets.

### Stage 3 — Release gates

- Chromium and Firefox build successfully.
- Unit, integration, and accessibility suites pass.
- IndexedDB migration and backup round-trip are tested with V1 fixtures.
- New permissions are absent unless the shipped feature actively uses them.
- Store copy and privacy policy match runtime behavior exactly.
- A manual smoke test covers install, capture, generation, edit, save, review,
  export, update from V1, and uninstall/reinstall recovery.

## Proposed module boundaries

These are target boundaries, not folders to create preemptively:

```text
src/
  background/
    sources/          source adapters: article, YouTube, local file, future OCR
    providers/        existing model adapters; no UI or storage access
  data/
    migrations/       explicit V1 -> V2 migrations and fixtures
    repositories/     the only UI/background route to durable library data
  features/
    capture/          orchestration and permission-aware capture contracts
    study/            session construction, answer modes, grading UX
    library/          tags, filters, bulk actions, smart decks
    import-export/    user-selected files and portable formats
  entrypoints/
    sidepanel/        composes feature surfaces; avoids owning domain logic
```

## Guardrails

- No account or Cramb-hosted backend is required for V2.
- No silent page reading, analytics, or content transmission.
- Generated material remains editable before it becomes a saved card.
- Avoid broad host permissions when a user-selected file or `activeTab` action
  can implement the same feature.
- Chat, knowledge graphs, and collaboration are not default V2 scope; they need
  separate evidence because they dilute the focused learning wedge and increase
  storage/security complexity.

## Decision gates

Before delivery begins, record decisions in [decision-log.md](decision-log.md):

- Which single user outcome defines V2 success?
- Which two or three feature modules form V2.0?
- Is V2 a no-account extension release, or does sync become part of the promise?
- Has each release artifact kept the accepted D-003 capture permissions intact?
- What data migration is required, and how is rollback handled?
