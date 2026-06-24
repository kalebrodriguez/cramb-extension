# Cramb — UI/UX Design System

> **Status:** Draft v0.1 · **Last updated:** 2026-06-20
> Companion file: `docs/design/mockup.html` (interactive high-fidelity mockup of the key screens, built with these exact tokens).

**Answers the question:** *What should it look and feel like?*

---

## 1. Brand

### 1.1 Essence
Cramb (pronounced *NEE-mee*) is named for the Greek muse of memory. The brand should feel like a **calm, focused study companion** — scholarly but modern, encouraging without being gamified or childish. It rewards consistency quietly; it never nags.

### 1.2 Personality
- **Calm, not loud.** Generous whitespace, soft motion, muted surfaces.
- **Focused.** One primary action per surface. The card is the hero.
- **Trustworthy.** Privacy-first language; nothing hidden; your data, your device.
- **Encouraging.** Progress framed positively ("All caught up", "3-day streak"), never shaming ("You missed 40 cards!").

### 1.3 Voice & tone (UX copy)
| Do | Don't |
|----|-------|
| "All caught up — nice." | "You have 0 cards. Why so few?" |
| "Set up a model to generate cards." | "Error: no provider configured (code 4012)." |
| "Your key and reading stay on this device." | (silence about privacy) |
| "12 cards added · Review now" | "Operation completed successfully." |

Microcopy rules: short, human, lowercase-friendly for secondary text, no exclamation spam, name the next action.

### 1.4 Logo
Wordmark **"cramb"** in the brand sans, paired with a mark: a simple **knot/loop glyph** (a loop = the spaced-repetition loop and the "tying a string around your finger" memory metaphor). Mark works as a monochrome 16px favicon and a 128px store icon. Minimum clear space = height of the "m". Provide light-on-dark and dark-on-light lockups.

---

## 2. Design tokens

Tokens are the single source of truth. Implemented as CSS custom properties and mirrored in the Tailwind theme. **Never hardcode raw hex in components** — reference tokens (see CLAUDE.md guardrails).

### 2.1 Color — primitives

```
/* Brand (violet-indigo: memory, focus, night study) */
--violet-50:  #F2F0FF;
--violet-100: #E4E0FF;
--violet-200: #C9C2FF;
--violet-300: #A99EFB;
--violet-400: #8C7DF7;
--violet-500: #6D5EF6;  /* brand base */
--violet-600: #5847E0;
--violet-700: #4738B8;
--violet-800: #342A85;
--violet-900: #241D5C;

/* Accent (amber: recall, highlight, the "aha") */
--amber-400: #FBBF4D;
--amber-500: #F5A524;
--amber-600: #D98A12;

/* Neutrals (slate) */
--slate-0:   #FFFFFF;
--slate-50:  #F8FAFC;
--slate-100: #F1F5F9;
--slate-200: #E2E8F0;
--slate-300: #CBD5E1;
--slate-400: #94A3B8;
--slate-500: #64748B;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1E293B;
--slate-900: #0F172A;
--slate-950: #0A0F1E;

/* Rating semantics (FSRS grades) */
--rating-again: #EF4444;  /* red    */
--rating-hard:  #F59E0B;  /* amber  */
--rating-good:  #22C55E;  /* green  */
--rating-easy:  #3B82F6;  /* blue   */

/* Status */
--success: #22C55E;
--warning: #F59E0B;
--danger:  #EF4444;
--info:    #3B82F6;
```

### 2.2 Color — semantic (theme-aware)

Dark mode is the **default** (people study at night; it's easier on the eyes). Light mode is fully supported.

```
/* DARK (default) */
:root, [data-theme="dark"] {
  --bg:            var(--slate-950);
  --bg-surface:    var(--slate-900);
  --bg-elevated:   var(--slate-800);
  --bg-input:      var(--slate-800);
  --border:        var(--slate-700);
  --border-subtle: var(--slate-800);
  --text:          var(--slate-50);
  --text-muted:    var(--slate-400);
  --text-faint:    var(--slate-500);
  --brand:         var(--violet-400);
  --brand-strong:  var(--violet-500);
  --on-brand:      var(--slate-0);
  --accent:        var(--amber-500);
  --focus-ring:    var(--violet-400);
}

/* LIGHT */
[data-theme="light"] {
  --bg:            var(--slate-50);
  --bg-surface:    var(--slate-0);
  --bg-elevated:   var(--slate-0);
  --bg-input:      var(--slate-0);
  --border:        var(--slate-200);
  --border-subtle: var(--slate-100);
  --text:          var(--slate-900);
  --text-muted:    var(--slate-500);
  --text-faint:    var(--slate-400);
  --brand:         var(--violet-600);
  --brand-strong:  var(--violet-700);
  --on-brand:      var(--slate-0);
  --accent:        var(--amber-600);
  --focus-ring:    var(--violet-500);
}
```

### 2.3 Typography

```
--font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--font-serif: "Source Serif 4", Georgia, "Times New Roman", serif; /* optional, for long card prose */
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; /* code on cards */

/* Type scale (1.250 major-third-ish, tuned for dense UI) */
--text-xs:   12px;  --leading-xs:   16px;
--text-sm:   13px;  --leading-sm:   18px;
--text-base: 14px;  --leading-base: 20px;   /* extension UIs run a touch smaller than web */
--text-md:   16px;  --leading-md:   24px;
--text-lg:   18px;  --leading-lg:   26px;
--text-xl:   22px;  --leading-xl:   30px;
--text-2xl:  28px;  --leading-2xl:  36px;

--weight-regular: 400;
--weight-medium:  500;
--weight-semibold:600;
--weight-bold:    700;
```

Usage: UI chrome uses `--font-sans`. Card *content* may use `--font-serif` for readability of longer prose (toggle in settings). Code snippets always `--font-mono`.

### 2.4 Spacing, radius, shadow, motion

```
/* Spacing (4px base) */
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;

/* Radius */
--radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-xl: 20px; --radius-full: 9999px;

/* Shadow (soft, low-contrast; dark mode uses subtle elevation) */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.30);
--shadow-md: 0 4px 12px rgba(0,0,0,0.35);
--shadow-lg: 0 12px 32px rgba(0,0,0,0.45);

/* Motion */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--dur-fast: 120ms; --dur-base: 200ms; --dur-slow: 320ms;
/* All transitions disabled when prefers-reduced-motion: reduce */

/* Z-index */
--z-toolbar: 2147483000; /* in-page toolbar must beat most page content */
--z-toast: 60; --z-modal: 50; --z-popover: 40;
```

### 2.5 Tailwind mapping (excerpt)

```js
// tailwind.config.ts (theme.extend)
colors: {
  bg: "var(--bg)", surface: "var(--bg-surface)", elevated: "var(--bg-elevated)",
  border: "var(--border)", text: "var(--text)", muted: "var(--text-muted)",
  brand: "var(--brand)", "brand-strong": "var(--brand-strong)", accent: "var(--accent)",
  rating: { again: "var(--rating-again)", hard: "var(--rating-hard)",
            good: "var(--rating-good)", easy: "var(--rating-easy)" },
},
borderRadius: { sm:"6px", md:"10px", lg:"14px", xl:"20px" },
fontFamily: { sans:["Inter","system-ui","sans-serif"], serif:["'Source Serif 4'","Georgia","serif"], mono:["'JetBrains Mono'","monospace"] },
```

---

## 3. Components

Each component lists: purpose, variants, states, and a11y notes. These map 1:1 to React components in `src/components/`.

### 3.1 Button
- **Variants:** `primary` (brand fill), `secondary` (surface + border), `ghost` (text only), `danger`.
- **Sizes:** `sm` (28px), `md` (34px), `lg` (40px).
- **States:** default, hover, active, focus-visible (2px `--focus-ring` ring + 2px offset), disabled (50% opacity, no pointer), loading (spinner replaces label, width preserved).
- **a11y:** real `<button>`; icon-only buttons require `aria-label`; min hit area 32×32.

### 3.2 Flashcard (the hero)
- The review card: front prompt centered, reveal divider, back answer, source badge (favicon + site) in a corner that deep-links to the origin.
- **States:** front-only, revealed, editing.
- Card content supports markdown subset (bold, lists, code, cloze highlight). Cloze blanks render as `[...]` on the front, filled + highlighted on the back.
- **a11y:** revealing is a button (`Space`); content region is `aria-live="polite"` so the answer is announced.

### 3.3 Rating bar
- Four buttons: Again / Hard / Good / Easy using `--rating-*` colors, each showing the *next interval* (e.g., "Good · 4d").
- Keyboard `1–4`. Selected state animates a subtle scale (respecting reduced-motion).
- **a11y:** grouped with `role="group"` + `aria-label="Grade your recall"`.

### 3.4 In-page capture toolbar
- A small floating pill that appears near a text selection: `✦ Make cards` + a caret menu (cards / cloze / quiz).
- Must visually survive on *any* site → high z-index, shadow-lg, its own shadow-DOM container to avoid page CSS bleed.
- Auto-dismiss on click-away or `Esc`.

### 3.5 Generated-card list item
- Editable card preview: front/back fields, type badge (Basic / Cloze / MCQ), delete, and an "accept" check. Bulk actions: accept all, deck picker.
- Inline validation (empty front/back disables save for that card).

### 3.6 Deck list item
- Deck name, card count, due count (amber pill), small progress ring, overflow menu (rename, export, delete).

### 3.7 Source badge / item
- Favicon + title + captured-at, links back to the URL (and timestamp for videos).

### 3.8 Supporting components
- **Progress ring** (due/cap), **Tag chip**, **Toast** (`aria-live`), **Empty state** (illustration + one CTA), **Setting field** (label, help text, control, error), **Provider/key field** (masked input + "test" button + status dot), **Streak indicator**, **Modal/confirm**, **Skeleton loaders** for generation latency.

---

## 4. Wireframes (low-fidelity)

### 4.1 Popup (launcher)
```
┌──────────────────────────────┐
│ ✦ cramb            ⚙        │
├──────────────────────────────┤
│        ◯ 12 due today        │
│     [   Review now   ]       │
│                              │
│  [ ＋ Capture this page ]     │
│  [ ▤ Open workspace    ]     │
├──────────────────────────────┤
│ 3-day streak · 142 cards     │
└──────────────────────────────┘
```

### 4.2 In-page capture toolbar (on selection)
```
        ┌─────────────────────────────┐
  …text │ ✦ Make cards  ▾ │  ✕         │
        └─────────────────────────────┘
                 ▾ menu: Q&A · Cloze · Quiz
```

### 4.3 Side panel — review
```
┌───────────────────────────┐
│ Review · Deck: React Hooks │
│ ▓▓▓▓▓▓░░░░  6 / 12         │
├───────────────────────────┤
│                           │
│   What does useMemo       │
│   return?                 │
│                           │
│   ───────[ Space ]─────── │
│                           │
│   A memoized value that   │
│   recomputes only when    │
│   its deps change.        │
│                           │
│  ◧ react.dev              │
├───────────────────────────┤
│ [Again 1m][Hard][Good 4d][Easy 9d] │
└───────────────────────────┘
```

### 4.4 Side panel — generated cards (post-capture)
```
┌───────────────────────────┐
│ 8 cards from "Big-O Guide" │
│ deck: [ Algorithms ▾ ]     │
├───────────────────────────┤
│ ☑ Basic                    │
│   Q: What is O(1)?         │
│   A: Constant time …       │  ✎  🗑
├───────────────────────────┤
│ ☑ Cloze                    │
│   Binary search is [O(log n)] │ ✎ 🗑
├───────────────────────────┤
│ ☐ Basic  (edited)          │
│   …                        │
├───────────────────────────┤
│ [ Accept all & save (7) ]  │
└───────────────────────────┘
```

### 4.5 Options — model & key
```
┌──────────────────────────────────────┐
│ Settings ▸ Model & key                │
│ Provider:  ( OpenAI ▾ )               │
│ API key:   [••••••••••••]  ● valid    │
│ Model:     ( gpt-… ▾ )                │
│ [ Test connection ]                   │
│                                       │
│ ○ Or run locally with Ollama          │
│   Endpoint: [http://localhost:11434]  │
│                                       │
│ ⓘ Your key & reading stay on device.  │
└──────────────────────────────────────┘
```

---

## 5. High-fidelity mockups
The interactive, on-brand rendering of the popup, review panel, capture toolbar, and generated-card list lives in **`docs/design/mockup.html`** — open it in a browser. It uses the exact tokens above and supports the dark (default) and light themes, so it doubles as a living visual reference for contributors.

---

## 6. Accessibility standards (WCAG 2.1 AA)
- **Contrast:** body text ≥ 4.5:1, large text/UI ≥ 3:1. Token pairs are chosen to pass in both themes; verify in CI with an automated contrast check.
- **Keyboard:** every action reachable and operable by keyboard; review is keyboard-first (`Space`, `1–4`, `U` undo).
- **Focus:** visible 2px focus ring on all interactive elements; logical focus order; focus moved intentionally on surface open.
- **Screen readers:** semantic landmarks; `aria-live` for toasts, errors, and card reveal; icon buttons labeled.
- **Motion:** honor `prefers-reduced-motion` (disable flips/scales).
- **Targets:** ≥ 32×32px hit areas; ≥ 24px spacing on dense lists.
- **Color independence:** rating buttons carry text labels + intervals, never color alone.

---

## 7. Iconography & imagery
- Icon set: a single consistent line set (e.g., Lucide) at 1.5px stroke, sized 16/20/24.
- Illustrations (empty states): minimal, single-accent line art — calm, not cartoonish.
- No stock photography.

---

## 8. Responsive / sizing rules
- **Popup:** fixed 320×~360px.
- **Side panel:** fluid 320–420px wide; layouts must hold at 320px.
- **Options/Onboarding:** full tab, max content width 720px, centered.
- Touch targets respected even though primary input is mouse/keyboard (some users run touch laptops).
