# Niche Validation & Market Research

> **Goal:** Validate the concept for Cramb before building out the core M1 capabilities. Do similar tools exist? Where do they fall short? What is our unique wedge?

## The Problem
When users read long-form articles or watch informational YouTube videos, retention is extremely low. Spaced repetition (Anki) solves this, but the friction of creating cards *while* reading/watching prevents adoption for casual web browsing. The gap between "consuming" and "memorizing" is too wide.

## Existing Solutions

A web search in 2026 for "browser extension turn reading into flashcards AI anki generator" reveals several competitors:

1. **Ghostwriter for Anki**
   - *Features:* AI-assisted flashcard creator, Copilot typing, triage queue, bring-your-own-key (OpenAI, Gemini).
   - *Drawback:* Requires desktop Anki to be running with the AnkiConnect add-on. Acts as a bridge, not a standalone tool.
2. **Copy to Anki / Anki generator, powered by open ai GPT**
   - *Features:* Highlight text to generate cards.
   - *Drawback:* Also deeply tied to AnkiConnect. If desktop Anki is closed, it either queues or fails. The review experience is entirely deferred to the Anki desktop app.
3. **Paperclips Copilot / Wisdolia**
   - *Features:* Autogenerate cards/MCQs from any webpage or YouTube video.
   - *Drawback:* Often push users toward proprietary platforms (Quizlet) or require a subscription for the AI generation.
4. **YouTube2Anki / AnkiDecks**
   - *Features:* Extract transcripts to generate cards.
   - *Drawback:* Single-source focus (only YouTube), relies on AnkiConnect.

## The Gap / User Pain Points
Almost all current solutions fall into one of two traps:
1. **The AnkiConnect Dependency:** They require the user to have the Anki desktop application open and running a specific local server add-on (AnkiConnect). This breaks the flow for users who just want to capture and review inside their browser without heavy desktop software.
2. **The Cloud Lock-in:** They are SaaS products that require an account, charge a monthly fee for the AI generation, and lock the user's data into their proprietary web app.

## Cramb's Unique Wedge

Cramb sits directly in the gap between "heavy Anki desktop" and "expensive SaaS":

- **In-Browser Review (The Game Changer):** Unlike the AnkiConnect bridges, Cramb has a built-in `ts-fsrs` scheduling engine. Users can capture *and review* directly within the extension's side panel. No Anki installation required.
- **Local-First & Private:** Data lives in IndexedDB on the user's device. No accounts. No tracking. No backend database.
- **Bring Your Own Model (BYOM):** Users plug in their own API keys (OpenAI, Anthropic, Google) or use a local Ollama instance. This guarantees zero recurring subscription fees from us, and absolute privacy for local models.
- **Anki Compatible, Not Dependent:** We support exporting to `.apkg` so power users can *choose* to move their cards to Anki later, but they are never forced to start there.

## Conclusion: VALIDATED
The niche is strongly validated. There is a high demand for AI-assisted flashcard generation from web content (evidenced by the proliferation of AnkiConnect extensions), but a massive gap for a self-contained, privacy-first, local-first browser extension that handles the end-to-end loop (capture -> generate -> review) without a SaaS subscription or desktop Anki dependency.

We are clear to proceed with Milestone 1.
