# Release checklist (v1.0.0)

Run top-to-bottom for a public release. See `docs/06-Implementation-Plan.md` for
the broader launch plan and `permissions-justifications.md` for store copy.

## 1. Code & quality gates

- [ ] `main` is green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm build:firefox`
- [ ] `pnpm test:e2e` (axe a11y gate) passes on the built extension
- [ ] `pnpm audit` reviewed — no unaddressed runtime (shipped) vulnerabilities
- [ ] Manual smoke on Chrome + one Chromium variant (Edge/Brave) + Firefox:
      capture page → edit → save → review → grade → Anki export
- [ ] Real provider smoke: OpenAI / Anthropic / Google / Ollama each generate once
- [ ] Error paths: no key, invalid key, rate-limited, no transcript, empty page

## 2. Version & changelog

- [ ] Bump `version` in `package.json`
- [ ] Move `CHANGELOG.md` `Unreleased` → `1.0.0` with the date; add compare link
- [ ] Update `CLAUDE.md` §7 status

## 3. Store assets

- [ ] Icons 16/32/48/128 (already in `public/icon/`)
- [ ] Screenshots (capture, review, decks, stats) for both stores
- [ ] Short + long listing description
- [ ] Privacy policy URL: https://kalebrodriguez.github.io/cramb-extension/privacy.html
- [ ] Per-permission justification text (from `permissions-justifications.md`)
- [ ] Category / language / support email

## 4. Package & submit

- [ ] `pnpm zip` (Chrome) and `pnpm zip:firefox` (AMO) produce clean artifacts
- [ ] Chrome Web Store: upload, fill listing + privacy + permissions, submit
- [ ] Firefox AMO: upload, fill listing, submit (source provided if requested)

## 5. Tag & announce

- [ ] `git tag v1.0.0 && git push --tags`
- [ ] GitHub Release with `CHANGELOG.md` notes + zipped builds attached
- [ ] Open the labeled `good first issue` queue for contributors

## Post-submission

- [ ] Watch for store-review feedback (permissions are the usual snag)
- [ ] Confirm the published listing's privacy disclosures match `SECURITY.md` and
      the privacy policy
