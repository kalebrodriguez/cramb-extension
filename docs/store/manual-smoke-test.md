# Manual smoke test (pre-release)

A click-by-click pass to run **before every store submission**, on each target
browser. Automated tests cover units + a11y, but the real capture→provider→review
loop and the Chromium-vs-Firefox panel behavior need a human. Budget ~15 min per
browser.

**Run on:** Chrome · one other Chromium (Edge or Brave) · Firefox.
Load the unpacked build (`.output/chrome-mv3`, or `.output/firefox-mv2` via
`about:debugging`).

> ✅ = expected result. If any step diverges, it's a release blocker.

## 0. Install & onboarding
- [ ] Load the unpacked extension. ✅ The **onboarding tab opens by itself**.
- [ ] Welcome → Connect: pick a provider, paste a key, **Test connection**.
      ✅ Goes green; **Continue stays disabled until it does**.
- [ ] First-card demo → **Make cards from this**. ✅ Cards render from the sample.
- [ ] Finish. ✅ Lands on the capture tips; no console errors.

## 1. Capture → generate → edit → save
- [ ] On a real article, open the popup → **Capture this page**.
      ✅ The **workspace opens** (side panel on Chromium, **sidebar on Firefox**)
      and shows the captured source.
- [ ] Generate. ✅ Editable cards appear; **edit one**; **delete one**.
- [ ] **Save**. ✅ Success toast (`Saved N cards…`); the deck appears on Home.
- [ ] Select text on a page → right-click → **Make cards from selection**.
      ✅ Workspace opens with the selection captured.
- [ ] On a YouTube video, popup → **Capture this video**.
      ✅ Transcript captured (or a clean "no transcript" message — no crash).

## 2. Review
- [ ] Home → **Review now**. ✅ A due card shows.
- [ ] `Space` reveals; `1`–`4` grade. ✅ Keyboard works; next card advances;
      interval labels look sane.
- [ ] Finish the queue. ✅ "All caught up" state.

## 3. Manage, search, export
- [ ] Decks tab: **rename**, **suspend**, **merge**, **delete** a deck. ✅ Each works.
- [ ] Deck detail: **add a manual card**; **edit**; **delete**. ✅ Each works.
- [ ] Search tab: query a known word. ✅ Returns matching cards/sources.
- [ ] Deck detail → **⤓ Anki**. ✅ A `.apkg` downloads; **import it into Anki** —
      cards appear correctly (basic + cloze).
- [ ] Options → Your data → **Export backup**, then **Import** it back.
      ✅ Library round-trips.

## 4. Theme & a11y spot-check
- [ ] Options → Appearance → toggle **Dark / Light / System**.
      ✅ Applies live across the open workspace; text stays readable.
- [ ] Tab through the popup and a workspace view with the keyboard.
      ✅ Visible focus ring; no traps.

## 5. Error paths (don't skip)
- [ ] Remove the key (or use a bad one) → generate. ✅ Friendly error toast,
      no stack trace, no stuck spinner.
- [ ] Capture a page with no real article content. ✅ Clean "couldn't extract"
      message.

## 6. Privacy sanity (the whole point)
- [ ] With DevTools → Network open during a capture+generate, confirm requests
      go **only** to the chosen provider's host (or `localhost` for Ollama).
      ✅ No other egress; no analytics calls.
- [ ] Search a JSON export for your key. ✅ **Not present.**

---

When all three browsers pass, proceed with `docs/store/release-checklist.md`.
