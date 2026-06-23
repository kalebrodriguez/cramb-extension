# Release checklist (v1.0.0)

Run top-to-bottom for a public release. See `docs/06-Implementation-Plan.md` for
the broader launch plan and `permissions-justifications.md` for store copy.

## 1. Code & quality gates

- [ ] `main` is green: `pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm build:firefox`
- [ ] `pnpm test:e2e` (axe a11y gate) passes on the built extension
- [ ] `pnpm audit` reviewed — no unaddressed runtime (shipped) vulnerabilities
- [ ] **Manual smoke test** on Chrome + one Chromium variant (Edge/Brave) +
      Firefox — full click-by-click pass in `manual-smoke-test.md`
- [ ] Real provider smoke: OpenAI / Anthropic / Google / Ollama each generate once
- [ ] Error paths: no key, invalid key, rate-limited, no transcript, empty page

## 2. Version & changelog

- [ ] Run **`pnpm release <version>`** — bumps `package.json`, rolls
      `CHANGELOG.md` (`Unreleased` → the version + date + links), and produces the
      Chrome/Firefox/sources zips in `.output/`. Use `--dry` first to preview.
- [ ] Update `CLAUDE.md` §7 status

## 3. Store assets

- [ ] Icons 16/32/48/128 (already in `public/icon/`)
- [ ] Screenshots (capture, review, decks, stats) for both stores
- [ ] Short + long listing description
- [ ] Privacy policy URL: https://kalebrodriguez.github.io/cramb-extension/privacy.html
- [ ] Per-permission justification text (from `permissions-justifications.md`)
- [ ] Category / language / support email

## 4. Package & submit

- [ ] Zips produced by `pnpm release` (or `pnpm zip` + `pnpm zip:firefox`):
      `cramb-<version>-{chrome,firefox,sources}.zip` in `.output/`
- [ ] Chrome Web Store: upload `…-chrome.zip`, fill listing + privacy + permissions, submit
- [ ] Firefox AMO: upload `…-firefox.zip` (+ `…-sources.zip` when source is requested), submit

## 5. Tag & announce

- [ ] `git commit -m "release: v<version>"` then `git tag v<version> && git push --tags`
- [ ] GitHub Release with `CHANGELOG.md` notes + the `.output/*.zip` builds attached
- [ ] Open the labeled `good first issue` queue for contributors

## Post-submission

- [ ] Watch for store-review feedback (permissions are the usual snag)
- [ ] Confirm the published listing's privacy disclosures match `SECURITY.md` and
      the privacy policy
