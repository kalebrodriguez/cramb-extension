<!-- Thanks for contributing to Cramb! Keep PRs small and single-concern. -->

## What & why

<!-- What does this change and why? Link any issue: Closes #123 -->

## How it was verified

- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm test`
- [ ] `pnpm build` (and `pnpm build:firefox` if behavior could differ)
- [ ] `pnpm test:e2e` (if UI changed)

## Checklist

- [ ] No secret or user content is logged, stored in IndexedDB, or exported.
- [ ] User content is sent only to the user's chosen provider (no new egress).
- [ ] No remote code; page HTML / model output is sanitized + Zod-validated.
- [ ] Generated cards are still shown for edit before saving.
- [ ] UI uses design tokens (no raw hex/spacing) and is keyboard + reduced-motion friendly.
- [ ] Data access goes through the repository layer (no direct Dexie from UI/SW).
- [ ] Tests added/updated proportional to risk; docs updated if behavior changed.

<!-- See CLAUDE.md §2 (golden rules) and CONTRIBUTING.md for details. -->
