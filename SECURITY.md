# Security Policy

Cramb is a privacy-first browser extension. Security and privacy are the product,
so we take reports seriously.

## Our security & privacy guarantees

These are hard invariants in the codebase (see `CLAUDE.md` §2). A violation of any
of them is a security bug:

1. **Your API key never leaves your device** except in requests to the provider
   you explicitly chose. It is read only in the background service worker, never
   logged, and never written to IndexedDB or any export.
2. **Your content is never sent anywhere except your chosen provider** (or your
   local Ollama). No analytics by default, no telemetry, no "phone home." All
   egress is HTTPS (or `localhost` for Ollama).
3. **No remote code.** Everything ships in the bundle — no `eval`, no remotely
   loaded scripts, MV3-compliant.
4. **All page HTML and model output is treated as untrusted** — sanitized with
   DOMPurify and validated with Zod before it is rendered or stored.

## Supported versions

Until v1.0.0, only the latest `main` is supported. After v1.0.0, the latest
released version receives security fixes.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Instead, report privately via GitHub's
[Report a vulnerability](https://github.com/kalebrodriguez/cramb-extension/security/advisories/new)
(Security → Advisories). If you cannot use that, open a minimal public issue
asking us to contact you, without disclosing details.

Please include:

- A description of the issue and its impact
- Steps to reproduce (a proof of concept if possible)
- The affected version/commit and browser

We aim to acknowledge reports within **72 hours** and to ship a fix or mitigation
for confirmed issues as quickly as is practical. We will credit reporters in the
release notes unless you ask us not to.

## Scope

In scope:

- Key/content leakage to any party other than the user's chosen provider
- Remote code execution or content-injection (e.g., unsanitized page HTML or
  model output reaching the DOM)
- Bypasses of the data boundaries above

Out of scope:

- Vulnerabilities in a provider's own API
- Issues that require a already-compromised browser or OS
- Findings in dev-only tooling that never ship in the extension bundle
