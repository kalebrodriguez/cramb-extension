# V2 decision log

Record product and architecture decisions here before implementation. Keep
alternatives and evidence so later contributors can understand the tradeoff.

## Template

```markdown
## D-000 — <decision>

- **Date:** YYYY-MM-DD
- **Status:** proposed | accepted | superseded | rejected
- **Owner:**
- **Context:**
- **Evidence:**
- **Options considered:**
- **Decision:**
- **Consequences:**
- **Permission impact:**
- **Data migration impact:**
- **Validation / rollback:**
```

## Open decisions

- D-001 — V2 north-star outcome and target.
- D-002 — V2.0 package selection.
- D-004 — V2 IndexedDB schema and migration policy.
- D-005 — Whether sync remains V2.x or enters V2.0.

## D-003 — Page-capture permission model

- **Date:** 2026-10-07
- **Status:** accepted
- **Owner:** Kaleb Rodriguez
- **Context:** The Chrome Web Store rejected v1 for declaring `scripting`
  without using it. Removing that permission in v1.0.1 fixed the immediate
  mismatch, but the remaining declarative `<all_urls>` content script still
  loaded on every page even though extraction only happens after a user action.
- **Evidence:** A focused prototype, five unit tests, and successful Chromium
  MV3 and Firefox MV2 production builds. Generated manifests contain no
  `content_scripts` or optional `<all_urls>` entry.
- **Options considered:** Keep the passive declarative content script; inject a
  packaged extractor on demand; request optional broad host access.
- **Decision:** Use `activeTab` plus `scripting.executeScript` on Chromium MV3.
  Use `activeTab` plus `tabs.executeScript` on Firefox MV2. Inject only after the
  user clicks page capture, and return plain text rather than page HTML.
- **Consequences:** Chromium legitimately declares and actively uses
  `scripting`; Firefox omits it. Capture cannot run on browser-restricted pages,
  and those failures must remain user-friendly.
- **Permission impact:** Adds `scripting` only to the Chromium MV3 artifact;
  removes persistent and optional `<all_urls>` access from both artifacts.
- **Data migration impact:** None.
- **Validation / rollback:** Keep the injection-path unit tests, inspect both
  packaged manifests, and manually smoke-test capture before release. Roll back
  to the v1.0.1 declarative extractor only if a supported browser cannot inject
  reliably, then update the store disclosure before shipping.
