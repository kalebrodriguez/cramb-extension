# Changelog

All notable changes to Cramb are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Capture → generate → review core loop.** Capture an article ("Capture this
  page"), a text selection (right-click "Make cards from selection"), or a
  YouTube video's transcript; an LLM using **your own** key (OpenAI / Anthropic /
  Google) or local **Ollama** generates editable flashcards; review them on an
  **FSRS** schedule, keyboard-first (`Space`, `1`–`4`).
- **Providers.** OpenAI, Anthropic, Google, and Ollama adapters with request
  timeouts and typed error mapping (`NO_MODEL_CONFIG`, `INVALID_KEY`,
  `RATE_LIMITED`, `BAD_LLM_OUTPUT`).
- **Card types.** Basic, cloze, and multiple-choice (MCQ) generation.
- **Deck & card management.** Rename / merge / delete / suspend decks; create,
  edit, suspend, and delete cards by hand.
- **Full-text search** across cards and sources.
- **Interop.** Per-deck Anki `.apkg` export (basic + cloze), and full JSON
  library export/import for backup and device migration.
- **Insight.** Home stats summary: streak, retention estimate, 7-day due forecast.
- **Onboarding wizard** on first install (connect a model with a live test → a
  live first-card demo → capture tips).
- **Theming.** Dark (default), light, and system themes that follow the OS and
  update live.
- **Accessibility.** WCAG 2.1 AA contrast across themes, labeled controls,
  reduced-motion support, and an automated axe gate over every surface in CI.

### Security & privacy

- API key is read only in the background service worker — never logged, stored in
  IndexedDB, or included in exports.
- User content is sent only to the user's chosen provider (or local Ollama); no
  analytics or third-party calls.
- No remote code; page HTML and model output are sanitized (DOMPurify) and
  validated (Zod).

[Unreleased]: https://github.com/kalebrodriguez/cramb-extension/commits/main
