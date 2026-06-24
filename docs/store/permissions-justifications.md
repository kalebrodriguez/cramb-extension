# Permission justifications (store submission)

Copy-ready rationale for each permission Cramb requests, for the Chrome Web Store
and Firefox AMO "why do you need this permission?" fields. Cramb is local-first
and requests the minimum needed for the capture → generate → review loop.

> Source of truth: `wxt.config.ts`. Keep this file in sync when permissions change.

## `permissions`

| Permission | Why it's needed |
|---|---|
| `activeTab` | To read the current tab's URL/title when the user clicks "Capture this page" or "Capture this video," so the captured source can be attributed. Grants access only to the tab the user acted on. |
| `scripting` | To run the Readability extractor in the page on an explicit capture, pulling the article text the user chose to turn into cards. Only runs on user action. |
| `storage` | To store the user's settings and their library (decks/cards/reviews live in IndexedDB; the API key lives in `chrome.storage.local`). Nothing is sent to us — there is no backend. |
| `sidePanel` | To open Cramb's review/management workspace in the browser side panel. (Firefox uses the equivalent `sidebar_action`.) |
| `contextMenus` | To add the right-click "Make cards from selection" item, the reliable way to capture highlighted text and open the workspace from a user gesture. |

## `host_permissions`

These are the **only** endpoints Cramb ever contacts. Each maps to a provider the
user can choose, plus YouTube for transcript capture. The user's content is sent
only to the provider they select.

| Host | Why it's needed |
|---|---|
| `https://api.openai.com/*` | Send text to OpenAI to generate cards — only if the user selects OpenAI and provides their own key. |
| `https://api.anthropic.com/*` | Same, for Anthropic. |
| `https://generativelanguage.googleapis.com/*` | Same, for Google Gemini. |
| `http://localhost:11434/*` | Talk to a **local** Ollama instance — never leaves the user's machine. |
| `https://www.youtube.com/*` | Fetch a video's transcript when the user clicks "Capture this video." |

## `optional_host_permissions`: `<all_urls>`

Requested **optionally** (not granted by default) so the user can capture an
article from an arbitrary site. The browser prompts for this at the moment of
capture; Cramb never reads pages in the background.

## Content Security Policy

`script-src 'self' 'wasm-unsafe-eval'` is required so the Anki `.apkg` exporter
can compile the bundled `sql.js` WebAssembly module. **No remote code** is loaded —
the wasm ships in the package and runs same-origin (golden rule §4).

## What Cramb does NOT do

- No analytics, telemetry, ads, or tracking.
- No backend and no accounts — there is nowhere for us to receive your data.
- The API key is read only in the background service worker; it is never logged,
  stored in IndexedDB, or included in any export.
