# V2 validation plan

## Desired outcome

Choose one V2 package that measurably increases completed review sessions while
preserving local-first trust. Discovery ends with a **proceed**, **pivot**, or
**stop** decision for each package.

## Highest-risk assumptions

| Assumption | Risk | Current certainty | Fastest useful test |
|---|---|---|---|
| Learners want deeper recall modes more than more capture formats | Desirability | Low | Clickable study-session prototype tested with 5–8 target users |
| Typed answers improve learning without making browser review feel slow | Usability | Low | Time-boxed comparison against current flip/self-rate flow |
| PDF capture materially increases weekly use | Desirability | Medium | Concierge import with 10 real study PDFs; observe repeat use |
| Text extraction is reliable enough without a backend | Feasibility | Medium | Fixture suite: born-digital, multi-column, formula-heavy, and scanned PDFs |
| Tags/filters solve real library pain before users have large libraries | Desirability | Low | Card-sort and prototype tasks using libraries of 50, 250, and 1,000 cards |
| Users understand and value the local-first/BYO-model tradeoff | Viability | Medium | Landing-page message test plus onboarding comprehension interview |
| Runtime page injection can reduce broad access without breaking Firefox | Feasibility/policy | High — spike passed 2026-10-07 | Keep the focused unit tests and packaged-manifest audit in release validation |

## Two-week discovery sprint

### Days 1–2: establish evidence

- Recruit 5–8 self-directed learners or students who already use flashcards.
- Record their current capture, card-authoring, and review workflows.
- Capture baseline task time and the most common abandonment point.

### Days 3–5: prototype

- Prototype Study Mode 2.0 in the existing side-panel dimensions.
- Prepare a concierge PDF-to-cards flow using representative files.
- Prototype tags/filters without changing the production schema.

### Days 6–8: test

- Measure task completion, time, errors, card edits, and stated trust.
- Ask users to choose which capability they would use next week, then verify by
  offering a follow-up session rather than relying only on preference.
- Run the permission spike and compare packaged manifests.

### Days 9–10: decide

- Score each package on evidence, not enthusiasm.
- Select at most three modules for V2.0.
- Write acceptance criteria and migration/permission plans.
- Move unselected ideas to V2.x or reject them explicitly.

## Proceed thresholds

### Study Mode 2.0

- At least 80% of testers complete a configured session without help.
- Median time per card does not rise by more than 30% unless users choose a more
  effortful answer mode.
- At least 4 of 5 target users prefer it for a real upcoming study task.

### PDF/file capture

- Useful text extracted from at least 90% of born-digital fixtures.
- Every generated card can link back to a source page or section when available.
- No new broad browsing permission is required for user-selected files.

### Smart local library

- At least 80% task success for find, bulk-tag, filter, and undo-delete tasks.
- Filtering remains responsive with 10,000 cards in a synthetic benchmark.
- V1 backup/import remains lossless after the proposed schema migration.

## Evidence log template

```markdown
### Experiment: <name>
- Date:
- Hypothesis:
- Participants / fixtures:
- Method:
- Observations:
- Quantitative result:
- Surprises:
- Decision: proceed | pivot | stop
- Follow-up:
```

### Experiment: user-triggered page-extraction permission spike

- Date: 2026-10-07
- Hypothesis: Cramb can remove its persistent `<all_urls>` content script while
  preserving page capture in Chromium MV3 and Firefox MV2.
- Participants / fixtures: mocked main-frame and error-path extraction results;
  packaged Chromium MV3 and Firefox MV2 artifacts.
- Method: inject one bundled unlisted extractor after the capture action; use
  `scripting.executeScript` on MV3 and `tabs.executeScript` on MV2; inspect both
  generated manifests.
- Quantitative result: 5 focused tests passed; both production builds passed;
  neither artifact contains `content_scripts` or optional `<all_urls>` access.
- Surprises: Firefox MV2 does not need the `scripting` manifest permission.
- Decision: proceed — accepted as D-003.
- Follow-up: complete one manual capture smoke test in each target browser before
  store packaging.
