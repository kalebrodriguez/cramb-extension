# Mneme — Technical Requirements Document (TRD)

> **Status:** Draft v0.1 · **Last updated:** 2026-06-20
> Pin exact dependency versions at project init (`pnpm create`), then record them here and in `CLAUDE.md`.

**Answers the question:** *How will we build it?*

---

## 1. Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Language | **TypeScript** (strict) | Type safety across surfaces + message contracts; broad contributor pool. |
| Extension framework | **WXT** | MV3-native, Vite-powered, cross-browser builds (Chromium + Firefox), HMR, auto-manifest. Removes the worst extension boilerplate → lower contributor barrier. |
| UI | **React 18 + Tailwind CSS** | Familiar, fast to contribute to; Tailwind theme is wired to the design tokens. |
| UI state | **Zustand** | Minimal global state for review session + settings; less ceremony than Redux. |
| Local DB | **IndexedDB via Dexie** | Ergonomic, indexed queries, migrations, large quota. |
| Scheduling | **FSRS** (`ts-fsrs`) | Modern, well-validated spaced-repetition algorithm; same family Anki adopted. |
| Content extraction | **@mozilla/readability** + DOMPurify | Robust main-content extraction; sanitization of captured HTML. |
| Markdown render | **markdown-it** (restricted) + DOMPurify | Render card content safely (no raw HTML injection). |
| LLM access | Provider adapters over `fetch` | OpenAI / Anthropic / Google / Ollama; structured output + schema validation (Zod). |
| Validation | **Zod** | Validate messages and LLM JSON output at every boundary. |
| Anki export | `.apkg` writer (SQLite via `sql.js`/wasm) | Generate Anki packages client-side; optional AnkiConnect. |
| Testing | **Vitest** (unit) + **Playwright** (e2e for extensions) | Fast unit loop; real-browser extension e2e. |
| Tooling | **pnpm**, **ESLint**, **Prettier**, **tsc** | Standard, CI-enforced. |
| CI/CD | **GitHub Actions** | Lint, typecheck, test, build, package; release zips for stores. |
| Packaging/release | WXT zip + `web-ext` | Produces Chromium and Firefox artifacts. |

> Stack note: framework/library choices above reflect the mature WebExtension ecosystem. Confirm current major versions and any MV-policy changes for each target browser during init (see Implementation Plan §0).

---

## 2. Architecture

### 2.1 Overview
Mneme is a **client-only, event-driven extension**. The background service worker is the brain (holds secrets, talks to providers, owns the DB-write path and scheduling); UI surfaces are thin clients that message the SW; the content script is a per-page agent for extraction and the capture toolbar.

```mermaid
flowchart TB
    subgraph Page["Web page (per-tab)"]
      CS[Content script: extractor + capture toolbar\n(isolated shadow-DOM UI)]
    end
    subgraph UI["Extension UI (React)"]
      POP[Popup]
      SP[Side panel: review + decks + generated cards]
      OPT[Options page]
      ONB[Onboarding]
    end
    subgraph BG["Background service worker (the 'backend')"]
      MH[Message hub + Zod validation]
      GEN[Generation orchestrator]
      SCH[FSRS scheduler]
      REPO[Repository layer]
      PROV[Provider adapters]
      EXP[Anki/JSON export]
    end
    DB[(IndexedDB / Dexie)]
    STORE[(chrome.storage.local\nsettings + secret)]
    LLM[(Chosen LLM provider / localhost Ollama)]

    CS <-->|messages| MH
    POP <-->|messages| MH
    SP <-->|messages| MH
    OPT <-->|messages| MH
    ONB <-->|messages| MH
    MH --> GEN --> PROV -->|HTTPS| LLM
    MH --> SCH
    MH --> REPO --> DB
    GEN --> REPO
    MH --> EXP
    PROV --> STORE
    OPT --> STORE
```

### 2.2 Key decisions & rationale
- **Secrets live only in the background SW.** Content scripts run inside untrusted pages, so they never touch the API key. All provider calls originate in the SW.
- **Repository layer wraps Dexie.** UI/SW never query Dexie directly; they go through typed repository functions (`cardRepo`, `deckRepo`, …). Keeps schema concerns in one place and makes migrations safe.
- **Generation is orchestrated server-worker-side**, including chunking long content, enforcing the card cap, schema validation, and the single auto-repair retry.
- **Side panel as primary workspace** (`chrome.sidePanel` on Chromium; sidebar action on Firefox) so review persists alongside browsing.
- **Shadow-DOM for the in-page toolbar** so arbitrary page CSS can't break it and our CSS can't leak into the page.
- **MV3 service-worker lifecycle is ephemeral** — no in-memory state is assumed to persist; all durable state is in IndexedDB/`chrome.storage`; long generations are resilient to SW suspension (chunk + persist intermediate `source` first).

### 2.3 Folder structure (target)
```
mneme/
├─ src/
│  ├─ background/        # service worker: message hub, orchestrators
│  │  ├─ index.ts
│  │  ├─ generation.ts
│  │  ├─ scheduler.ts        # ts-fsrs wrapper
│  │  └─ providers/          # openai.ts, anthropic.ts, google.ts, ollama.ts, index.ts
│  ├─ content/           # extractor.ts, toolbar/ (shadow-DOM React root)
│  ├─ ui/
│  │  ├─ popup/  side-panel/  options/  onboarding/
│  │  └─ components/         # design-system components
│  ├─ data/              # dexie db, repositories, migrations, zod schemas
│  ├─ lib/               # shared utils, message types, errors, tokens
│  └─ styles/            # tailwind + token CSS
├─ tests/               # vitest unit + playwright e2e
├─ docs/                # these documents
├─ .github/workflows/   # CI
├─ wxt.config.ts
├─ tailwind.config.ts
└─ package.json
```

---

## 3. APIs

### 3.1 Internal message API
Defined in `04-Backend-Schema.md` §5 — typed envelope, `Result<T>` returns, canonical error codes. This is the contract every surface uses to talk to the SW.

### 3.2 External provider API (egress)
- **OpenAI / Anthropic / Google:** chat/complet載-style endpoints with **structured output** (JSON schema / tool-calling) to force the card schema; bearer auth with the user's key.
- **Ollama:** `POST http://localhost:11434/api/chat` with `format: json`.
- Uniform adapter interface (`LLMProvider`, Backend-Schema §6.2). Timeouts, retry/backoff, and error normalization live in the adapter base.

### 3.3 Export API (egress, optional)
- `.apkg` file (no network).
- AnkiConnect `POST http://localhost:8765` (`addNotes`, `createDeck`) when present.

### 3.4 No ingress API in v1
There is no inbound server; nothing listens for external requests. (A sync ingress is the only candidate for the future — Backend-Schema §9.)

---

## 4. Security requirements

Security is a first-class requirement because Mneme handles a user secret (API key) and the content of everything they capture.

### 4.1 Secret handling
- API key stored in `chrome.storage.local` under a dedicated key; **never** in IndexedDB, **never** in exports, **never** logged, **never** sent to content scripts/pages.
- Key read only at call time inside the SW; held in a local variable for the request, not cached globally beyond need.
- Provide a one-click "remove key / wipe data" in Options.

### 4.2 Content & egress
- The only egress of user content is the specific text sent to the **user-chosen** provider for generation — disclosed in onboarding and Options.
- All egress over TLS (or `localhost` for Ollama). Pin exact provider host permissions in the manifest; no wildcard third-party hosts.
- No remote code execution: MV3 forbids remote scripts; we ship all code in the bundle. No `eval`, no remote `<script>`.

### 4.3 Injection & rendering safety
- Captured HTML sanitized with DOMPurify before extraction/storage.
- Card markdown rendered through a restricted markdown-it config + DOMPurify (no raw HTML, safe links only).
- The in-page toolbar is isolated in a shadow root; it reads selection text, not arbitrary page scripts.

### 4.4 Permissions discipline
- Prefer `activeTab` + on-demand `scripting` over broad host permissions.
- Broad host access is **optional**, off by default, requested only if the user enables auto-capture everywhere.
- Document a justification for every permission (store-review ready).

### 4.5 Validation & supply chain
- Zod-validate every inbound message and every LLM JSON payload (treat model output as untrusted).
- Minimal dependency surface; `pnpm audit` + Dependabot in CI; lockfile committed; pin versions.
- CSP for extension pages; Trusted Types where supported.

### 4.6 Privacy
- No analytics/telemetry by default. Any future analytics is opt-in and never includes card/source content or the key.
- Clear, plain-language privacy disclosure shipped in-app and in the store listing.

---

## 5. Scalability & performance

"Scale" here is **on-device scale** (one user, potentially tens of thousands of cards) plus **project/community scale**, not server load.

### 5.1 Data scale (per user)
- Target smoothness at **50k cards / 200k review logs**.
- Indexed `due` and compound `[deckId+due]` keep the due-query O(log n + k). Avoid full table scans in hot paths.
- Paginate decks/sources lists; virtualize long card lists.
- Keep `reviews` append-only; aggregate stats incrementally (don't recompute from full history each open).
- `source.rawText` prunable to cap storage growth.

### 5.2 Generation performance
- p95 end-to-end generation ≤ ~8s for a typical article; show skeletons + streaming progress.
- Chunk long content; cap cards per capture; cache the `source` before calling the model so a suspended SW doesn't lose work.
- Backoff + jitter on 429s; queue captures when rate-limited.
- Token-budget guardrails to control user cost.

### 5.3 Runtime constraints (MV3)
- Assume the SW can be killed anytime; persist early, resume gracefully.
- Keep bundle small; lazy-load heavy modules (e.g., the `.apkg`/`sql.js` wasm only when exporting).

### 5.4 Cross-browser scale
- One codebase → Chromium (Chrome/Edge/Brave) + Firefox via WXT. Safari is a later, separate target (different packaging).
- e2e matrix runs against Chromium + Firefox in CI.

### 5.5 Project scalability (contributor throughput)
- The **provider adapter** and **source adapter** interfaces are designed so new integrations are self-contained PRs that don't touch core.
- Clear module boundaries (background / data / ui / content) keep blast radius small and reviews simple.

---

## 6. Observability & quality gates
- **Dev:** structured console logging behind a debug flag (never logs secrets/content).
- **CI gates (must pass to merge):** typecheck, lint, unit tests, build for Chromium+Firefox, bundle-size budget, accessibility-contrast check on tokens, and a small **LLM-output eval** that runs generation against fixtures using a mocked provider (record/replay), asserting schema validity and reasonable card counts.
- **Error surfacing:** user-facing errors map from canonical codes (Backend-Schema §5) to friendly copy; no silent failures.

---

## 7. Risks & technical mitigations
| Risk | Mitigation |
|------|------------|
| Provider API shape changes | Thin adapters isolate change; contract tests per adapter. |
| MV3 SW suspension mid-generation | Persist source first; resumable generation; idempotent saves. |
| Inconsistent extraction across sites | Readability + per-site adapter overrides; graceful empty-page fallback. |
| LLM returns junk/unsafe content | Schema validation + repair retry + sanitization; treat output as untrusted. |
| Storage eviction | `navigator.storage.persist()`; prune rawText; export reminders. |
| Cross-browser API gaps (sidePanel etc.) | Feature-detect; Firefox sidebar fallback; abstraction in `lib/`. |
