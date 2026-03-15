# Design Audit: Findings Report

## Todo List

### Critical Issues
- [x] C1. Fix font-weight 900 → `400` on all headings (verify nav + footer sizing after)
- [x] C2. Unify heading weight to `400` inside/outside `.content`
- [x] C3. Standardize on Bulma `is-size-*`, remove custom `--heading-font-size-*` properties
- [x] C4. Give links a distinct color (`rgb(200 200 140)` in theme-joe)

### Medium Issues
- [x] M1. Remove dead CSS custom properties (`--dark-color`, `--section-color1/2`)
- [x] M2. Wire up `--link-hover-color` in `a:hover` rule
- [x] M3. Fix double padding on nested sections (remove from `.section`)
- [x] M4. Align custom 900px breakpoint to Bulma (`1024px`)
- [x] M5. Standardize page title structure: `div.content > h1.title` everywhere
- [x] M6. Fix off-scale spacing on `.filter-wrapper` (15px → 1rem)
- [x] M7. Fix off-scale spacing on `.card-content` (1.8rem → 2rem)
- [x] M8. Replace hardcoded `.card` background with `var(--background-color)`
- [x] M9. Fix duplicate `h1` on news-post page → `h2.title`
- [x] M10. Improve news post date contrast (`has-text-grey-light`)

### Polish
- [x] P1. Systematize heading font-size scale (now using Bulma's built-in scale via `is-size-*`)
- [x] P2. Add `letter-spacing: 0.03em` to uppercase headings
- [x] P3. Update hardcoded footer year "2025" → dynamic Liquid `{{ "now" | date: "%Y" }}`
- [x] P4. Standardize icon spacing across header/footer/about/modal (`mr-4`)
- [x] P5. Replace hardcoded white on music player SVG → `var(--text-color)`
- [x] P6. Fix font-family fallback chain: remove `!important`, add fallbacks to theme vars
- [x] P7. Improve member card overlay: replace fixed `250px`/`75%` with flexbox

---

## Codebase Inventory Summary

**Pages/Routes**: Home (`/`), About (`/about/`), Productions (`/productions/`), Graphics (`/graphics/`), Music (`/music/`), Members (`/members/`), News (`/news/`), News Posts (`/news/{slug}/`), 404

**CSS Files**: `bulma.css` (framework), `fonts.css` (4 @font-face declarations), `styles.css` (375 lines, base variables + components), `theme-joe.css` (active dark theme, 126 lines), `theme-first.css` (alt theme, 45 lines), `index.css` (entry point)

**Active Theme**: `theme-joe` (dark, Passero One + Edit Undo Brk fonts, glow effects)

---

## 1. Typography Audit

### 1.1 Font Weight Inventory

| Location | Value | Applied To |
|---|---|---|
| `styles.css:107` | `900` | All `h1`-`h6` elements globally |
| `styles.css:44` (Bulma var) | `400` | `.content` headings via `--bulma-content-heading-weight` |
| `footer.liquid:6` | `500` | Footer tagline via `has-text-weight-medium` |
| `fonts.css` | `normal` (400) | All four @font-face declarations |

### 1.2 Font Size Systems (two competing)

**System A — CSS custom properties** (only apply when `.title` class is present):

| Token | Value | Ratio to next |
|---|---|---|
| `--heading-font-size-xxl` | 36px | 1.24x |
| `--heading-font-size-xl` | 29px | 1.32x |
| `--heading-font-size-l` | 22px | 1.38x |
| `--heading-font-size-m` | 16px | 1.14x |
| `--heading-font-size-s` | 14px | 1.17x |
| `--heading-font-size-xs` | 12px | — |

**System B — Bulma `is-size-*` inline classes** used in templates:

- `is-size-3` (navbar items, brand) = 2rem/32px
- `is-size-4` (home intro, 404 text, footer, about body, touch nav) = 1.5rem/24px
- `is-size-5` (about section, news teasers) = 1.25rem/20px
- `is-size-7` (news post date) = 0.75rem/12px
- `is-size-2` (news-post "Other Posts" heading) = 2.5rem/40px

### 1.3 Line Height & Letter Spacing

- `h1-h6`: `line-height: 1.25` — consistent
- Body text: Bulma default (`1.5`) — fine
- No `letter-spacing` set anywhere in custom CSS
- `text-transform: uppercase` on all headings + footer

---

## 2. Color Hierarchy Audit

### 2.1 Full Palette (theme-joe, active)

| Variable | Value | Hex Equiv | Role |
|---|---|---|---|
| `--background-color` | `black` | `#000000` | Page background |
| `--text-color` | `rgb(220 231 231)` | `#DCE7E7` | Primary text |
| `--light-color` | `rgb(251 221 14)` | `#FBDD0E` | Accent/subtitle/hover glow |
| `--dark-color` | `rgb(251 93 0)` | `#FB5D00` | **Unused** — defined but never referenced |
| `--section-color1` | `rgb(51 85 85)` | `#335555` | **Unused** — defined but never referenced |
| `--section-color2` | `rgb(68 68 68)` | `#444444` | **Unused** — defined but never referenced |
| `--link-color` | `var(--text-color)` | `#DCE7E7` | Link text (same as body text) |
| `--link-hover-color` | `var(--light-color)` | `#FBDD0E` | **Unused** — defined but never referenced in CSS |

### 2.2 Hardcoded Colors

| File:Line | Value | Context |
|---|---|---|
| `styles.css:198` | `black` | `.card` background |
| `styles.css:324` | `rgba(0,0,0,0.3)` | Music player overlay |
| `styles.css:334` | `rgba(0,0,0,0.5)` | Music player overlay hover |
| `styles.css:365` | `white` | Music player icon SVG fill |
| `styles.css:366` | `rgba(0,0,0,0.3)` | Music player icon drop-shadow |
| `styles.css:371` | `rgba(0,0,0,0.4)` | Music player icon hover shadow |

### 2.3 Contrast Issues

| Element | Foreground | Background | Ratio | Status |
|---|---|---|---|---|
| Body text | `#DCE7E7` | `#000000` | ~15:1 | Pass |
| Subtitle on card | `#FBDD0E` | dark gradient | ~12:1+ | Pass |
| News date (`has-text-grey`) | `#7a7a7a` (Bulma) | `#000000` | ~4.5:1 | Borderline AA |
| Filter select border | `#DCE7E7` | `#000000` | ~15:1 | Pass |

---

## 3. Layout Audit

### 3.1 Container System

- `.site-container`: `max-width: 1200px`, `padding: 0 1rem`
- `.section`: `margin: 1rem auto`, `padding: 0 1rem`
- `.section .content`: `max-width: 1200px`, `margin: 1rem auto`
- Result: content inside `.section > .content` gets **double padding** (1rem from container + 1rem from section = 2rem each side)

### 3.2 Grid Usage

All card grids use Bulma: `columns is-multiline` → `column is-one-third`. News uses `column is-one-fifth` + `column`. Footer uses 3 equal columns.

### 3.3 Breakpoints

- Bulma standard: 769px (tablet), 1024px (desktop), 1216px (widescreen)
- Custom: `900px` for hiding navbar social icons — doesn't match Bulma
- Nav touch: `is-size-4-touch` (below 1024px)

### 3.4 Page Structure Inconsistencies

| Page | Title Wrapper | Has `.content` wrapper | Has filter |
|---|---|---|---|
| Home | No explicit h1 | Yes (`.content`) | No |
| Productions | `div > h1.title` | No | Yes |
| Graphics | `div > h1.title` | No | Yes |
| Music | `div > h1.title` | No | Yes |
| Members | `div > h1.title` | No | No |
| News | `div > h1.title` | No | No |
| News Post | `.content > h1.title` | Yes | No |
| About | No (inline `is-size-5` on section) | No | No |

---

## 4. Spacing Audit

### 4.1 All Spacing Values

**CSS custom values** (non-Bulma):

| Value | Where | Px equiv |
|---|---|---|
| `1rem` | `.section` margin, `.section` padding, `.site-container` padding, `.section .content` margin | 16px |
| `2rem` | `.section.logo` padding-top/bottom | 32px |
| `1.8rem` | `.card-content` padding-top/bottom | 28.8px |
| `0.8em` | `h1-h6` margin-top | Variable |
| `0.25em` | `h1-h6` margin-bottom | Variable |
| `15px` | `.filter-wrapper` margin-bottom | 15px |
| `0.75rem` | `.navbar-item` padding-top/bottom | 12px |
| `1.5rem` | `.navbar-item` padding-right | 24px |
| `250px` | `.card-content.members` height | 250px |
| `0.5rem` | `.navbar-burger` width | 8px |

**Bulma utility classes used in templates**: `py-0`, `mb-3`(12px), `mr-4`(16px), `mb-5`/`mt-5`/`pt-5`/`py-5`/`px-5`/`pb-5`(24px), `mx-3`(12px), `pt-3`(12px)

### 4.2 Spacing Scale Assessment

No formal scale exists. The values roughly cluster around: 8, 12, 15, 16, 24, 28.8, 32, 250px — this is **not** a consistent scale.

---

## Findings by Priority

### Critical Issues (must fix)

**C1. Font-weight 900 on display fonts that only ship weight 400**
- **Where**: `styles.css:107` (`h1-h6 { font-weight: 900 }`) + `fonts.css` (all `font-weight: normal`)
- **Why**: 'Passero One' and 'Edit Undo Brk' are single-weight display fonts. Requesting weight 900 either does nothing or triggers faux-bolding (browser-synthesized, looks poor). The intent is clearly for these decorative fonts to display at their natural weight.
- **Current**: `font-weight: 900`
- **Proposed**: `font-weight: normal` (or `400`) — let the fonts render at their designed weight. The visual hierarchy is already established by font-size and text-transform.

> **DECISION:** Use `400`. Verify nav + footer sizing after change. Monitor headline vs body distinction — if insufficient, consider using font-family difference (Passero One vs Edit Undo Brk) as the primary differentiator.

**C2. Conflicting heading weight inside `.content` vs. outside**
- **Where**: `styles.css:44` sets `--bulma-content-heading-weight: 400` for `.content` headings; `styles.css:107` sets `font-weight: 900` for all `h1-h6`
- **Why**: A heading inside `.content` (e.g., news posts, home page) gets a different visual weight than an identical heading outside `.content` (e.g., gallery page titles). This is confusing and inconsistent.
- **Current**: 900 outside `.content`, 400 inside `.content` (via Bulma variable)
- **Proposed**: Unify to `400` everywhere (aligning with C1 fix), or use a single explicit token.

> **DECISION:** Unify to `400` everywhere.

**C3. Two competing font-size systems**
- **Where**: `styles.css:90-95` (custom properties on `.title`) vs. `is-size-*` Bulma classes across all templates
- **Why**: Same semantic elements (section headings, card titles) are sized through two completely different mechanisms. When templates use `is-size-3` instead of `h2.title`, the custom heading scale is bypassed entirely. This makes the type hierarchy unpredictable and hard to maintain.
- **Current**: Mixed use of `--heading-font-size-*` tokens and `is-size-*` utility classes
- **Proposed**: Standardize on one system. Since Bulma's `is-size-*` is already heavily used in templates, either: (a) adopt it as the standard and remove the unused custom properties, or (b) replace all `is-size-*` usages with proper semantic heading levels + `.title` class. Option (b) is more maintainable.

> **DECISION:** Standardize on Bulma `is-size-*` utilities. Remove custom `--heading-font-size-*` properties and the `h1.title`-`h6.title` size rules from `styles.css`.

**C4. Links indistinguishable from body text**
- **Where**: `styles.css:9` (`--link-color: var(--text-color)`) and `theme-joe.css:21` (same)
- **Why**: With `--link-color` equal to `--text-color`, inline links have zero visual distinction from surrounding text until hovered. This is an accessibility issue (WCAG 1.4.1 requires links to be distinguishable by more than color alone, but having *no* difference at all is worse).
- **Current**: Links and text are identical `rgb(220 231 231)`
- **Proposed**: Give `--link-color` a subtly distinct value — e.g., the accent yellow `var(--light-color)` at reduced intensity, or an underline. The about page partially solves this with `text-decoration: underline` on `.news-post a`, but it's inconsistent.

> **DECISION:** Give links a distinct color. Proposal: use a muted version of the accent — something like `rgb(200 200 140)` (warm off-white) that's visible but not as bright as the full yellow glow. The glow hover effect stays as-is.

### Medium Issues (should fix)

**M1. Three dead CSS custom properties**
- **Where**: `--dark-color`, `--section-color1`, `--section-color2` defined in `styles.css` and both theme files
- **Why**: Defined across 3 files but never referenced in any CSS rule. This is dead code that adds cognitive overhead when maintaining the palette.
- **Current**: Defined, never used
- **Proposed**: Either remove them or start using them intentionally (e.g., `--dark-color` for hover accents, `--section-color1/2` for alternating section backgrounds).

> **DECISION:** Remove all three.

**M2. `--link-hover-color` defined but never used**
- **Where**: Both `styles.css:10` and `theme-joe.css:10`
- **Why**: There's no `a:hover { color: var(--link-hover-color) }` rule anywhere. The hover effect in theme-joe uses text-shadow glow instead.
- **Current**: Variable exists but is orphaned
- **Proposed**: Remove or wire up in `a:hover` rule.

> **DECISION:** Keep the variable and wire it up: add `a:hover { color: var(--link-hover-color) }`. This works alongside the existing glow text-shadow in theme-joe.

**M3. Double padding on nested sections**
- **Where**: `.site-container { padding: 0 1rem }` + `.section { padding: 0 1rem }`
- **Why**: Content in a section gets 2rem of horizontal padding on each side (1rem from container + 1rem from section). On mobile this eats significant horizontal space. The intent is likely just 1rem total.
- **Current**: 2rem effective padding
- **Proposed**: Remove padding from `.section` (the container already handles it) or set `.section { padding: 0 }`.

> **DECISION:** Approved.

**M4. Custom 900px breakpoint doesn't match Bulma**
- **Where**: `styles.css:150` (`@media (width >= 900px)`)
- **Why**: Bulma's breakpoints are 769px (tablet), 1024px (desktop). Using 900px creates a zone (769-900px) where Bulma thinks it's tablet but the custom CSS doesn't match.
- **Current**: `900px`
- **Proposed**: Align to `1024px` (Bulma desktop) or `769px` (Bulma tablet).

> **DECISION:** Approved.

**M5. Inconsistent page structure**
- **Where**: Gallery pages wrap titles in `div > h1.title` (no `.content`), home page uses `.content > h1`, news-post uses `.content > h1.title`, about page uses none
- **Why**: Different wrapping structures mean different CSS rules apply (`.section .content` max-width, `.content h1` color rules, heading weight override). The visual output differs per page for no intentional reason.
- **Current**: 4 different patterns for page titles
- **Proposed**: Standardize on `div.content > h1.title` for all pages.

> **DECISION:** Approved.

**M6. Off-scale spacing: `filter-wrapper` margin**
- **Where**: `styles.css:302` (`.filter-wrapper { margin-bottom: 15px }`)
- **Why**: 15px doesn't align with any spacing increment (Bulma uses multiples of 0.25rem = 4px). Should be 12px (0.75rem) or 16px (1rem).
- **Current**: `15px`
- **Proposed**: `1rem` (16px)

> **DECISION:** Approved.

**M7. Off-scale spacing: card-content padding**
- **Where**: `styles.css:230` (`.card-content { padding-top: 1.8rem; padding-bottom: 1.8rem }`)
- **Why**: 1.8rem (28.8px) isn't on any standard scale. Nearest clean values: 1.5rem (24px) or 2rem (32px).
- **Current**: `1.8rem`
- **Proposed**: `1.5rem` (tighter) or `2rem` (more breathing room)

> **DECISION:** Use `2rem`.

**M8. Hardcoded `.card { background-color: black }`**
- **Where**: `styles.css:198`
- **Why**: Should use `var(--background-color)` so it adapts to theme changes. Currently theme-first would have cards with black backgrounds on a dark-gray page, creating a visible mismatch.
- **Current**: `black`
- **Proposed**: `var(--background-color)`

> **DECISION:** Approved.

**M9. News-post "Other Posts" heading semantic mismatch**
- **Where**: `news-post.liquid:23` — `<h1 class="is-size-2">Other Posts</h1>`
- **Why**: Uses `h1` (should only appear once per page as the primary heading) with `is-size-2` to make it bigger than the default h1. The page already has an `h1.title` for the post title. Two `h1`s hurts document outline and SEO.
- **Current**: `h1.is-size-2`
- **Proposed**: `h2.title` — semantic h2, sized via the token system

> **DECISION:** Approved.

**M10. News post date low contrast**
- **Where**: `news-post.liquid:14` — `<p class="is-size-7 has-text-grey">`
- **Why**: Bulma's `has-text-grey` (#7a7a7a) on black background is ~4.5:1, which barely passes WCAG AA for normal text but at `is-size-7` (12px) it needs 4.5:1 for AA. It's right on the edge and could be improved.
- **Current**: `has-text-grey` (#7a7a7a on #000)
- **Proposed**: Use a lighter grey or the `--text-color` at reduced opacity

> **DECISION:** Approved.

### Polish Opportunities (nice to fix)

**P1. Heading font-size scale could use a more systematic ratio**
- **Current**: 36/29/22/16/14/12 (irregular jumps)
- **Proposed**: A ~1.25 modular scale: 12/15/19/24/30/38 (or similar). This produces more even visual steps.

> **DECISION:** Approved.

**P2. No letter-spacing on uppercase headings**
- **Where**: All `h1-h6` have `text-transform: uppercase` but no letter-spacing
- **Why**: Uppercase text is more legible with slight positive letter-spacing (0.02-0.05em). This is a common typographic refinement.
- **Proposed**: `letter-spacing: 0.03em` on headings

> **DECISION:** Approved.

**P3. Footer year is hardcoded "2025"**
- **Where**: `footer.liquid:6`
- **Why**: Will be out of date in 2026 (which is now). Should be dynamic or at minimum updated.
- **Current**: "The Sleeping Gods in 2025"
- **Proposed**: Update to current year or use a dynamic approach

> **DECISION:** Approved.

**P4. Inconsistent icon spacing**
- **Where**: Social icons in header, footer, and about page all use `mr-4` (16px), but modal buttons use `mx-3` (12px)
- **Proposed**: Standardize on one spacing value for icon groups

> **DECISION:** Approved.

**P5. Music player SVG fill hardcoded white**
- **Where**: `styles.css:365`
- **Proposed**: `fill: var(--text-color)`

> **DECISION:** Approved.

**P6. `font-family` has redundant `sans-serif` fallback**
- **Where**: `styles.css:56` — `font-family: var(--body-font-family), sans-serif !important`
- **Why**: The base `--body-font-family` already includes `'Helvetica', 'Arial', sans-serif`. The theme override to `'Edit Undo Brk'` loses the fallback chain because the `!important` rule replaces the whole value. If Edit Undo Brk fails to load, there's no intermediate fallback.
- **Proposed**: Remove the `!important` from the `html, body` rule (it shouldn't be needed since it's already high-specificity). Add fallbacks directly in the theme variable definitions: `--body-font-family: 'Edit Undo Brk', 'Helvetica', 'Arial', sans-serif` in `theme-joe.css`, so the fallback chain is always complete regardless of which theme is active.

> **DECISION:** Approved.

**P7. Card member overlay uses fixed `height: 250px` and `top: 75%`**
- **Where**: `styles.css:238-245`
- **Why**: Fragile on different card sizes. If the card aspect ratio changes or the viewport is very small/large, the overlay positioning breaks.
- **Proposed**: Use percentage-based height or flexbox-based positioning

> **DECISION:** Approved.

---

## Implementation Plan

### Step 1: Simplify Token System

Since we're standardizing on Bulma `is-size-*` for font sizing, the custom `--heading-font-size-*` properties can be **removed entirely**. The token system simplifies to:

```css
body {
  /* Colors (cleaned up — dead vars removed) */
  --background-color: black;
  --text-color: rgb(220 231 231);
  --light-color: rgb(251 221 14);
  --link-color: rgb(200 200 140);        /* distinct from text-color */
  --link-hover-color: var(--light-color); /* now wired up */
  --overlay-color: linear-gradient(...);

  /* Fonts (with full fallback chains in theme files) */
  --heading-font-family: 'Passero One', 'Helvetica', 'Arial', sans-serif;
  --body-font-family: 'Edit Undo Brk', 'Helvetica', 'Arial', sans-serif;
  --mono-font-family: 'Edit Undo Brk', monospace;
}
```

Spacing will use Bulma utility classes (`mb-3`, `mb-5`, `px-5`, etc.) consistently rather than adding new custom properties. Off-scale values (15px, 1.8rem) get corrected to nearest Bulma-aligned value.

### Step 2: Priority Order of Changes

| Order | Issue(s) | Impact | Risk | Files |
|---|---|---|---|---|
| 1 | C1 + C2 | High (fixes faux-bold across all pages) | Low | `styles.css` |
| 2 | C4 | High (accessibility + usability) | Low | `styles.css`, `theme-joe.css` |
| 3 | M1 + M2 | Medium (code cleanup) | Low | `styles.css`, `theme-joe.css`, `theme-first.css` |
| 4 | M3 | Medium (fixes mobile spacing) | Medium | `styles.css` |
| 5 | M8 | Medium (theme consistency) | Low | `styles.css` |
| 6 | M6 + M7 | Medium (spacing consistency) | Low | `styles.css` |
| 7 | C3 + M5 | High (structural consistency) | Medium | All page templates + `styles.css` |
| 8 | M4 | Medium (breakpoint alignment) | Medium | `styles.css` |
| 9 | M9 + M10 | Medium (semantics + contrast) | Low | `news-post.liquid` |
| 10 | P1-P7 | Low (polish) | Low-Medium | Various |

### Step 3: Changes Grouped by File

**`styles.css`** (global — affects all pages):
- C1: Change `h1-h6 { font-weight: 900 }` → `font-weight: 400`
- C2: `--bulma-content-heading-weight: 400` already matches — no change needed
- C3: Remove `--heading-font-size-*` custom properties and `h1.title`-`h6.title` size rules
- C4: Change `--link-color` to `rgb(200 200 140)` (warm off-white, distinct from text)
- M1: Remove `--dark-color`, `--section-color1`, `--section-color2`
- M2: Add `a:hover { color: var(--link-hover-color) }` rule
- M3: Remove `padding: 0 1rem` from `.section`
- M6: `.filter-wrapper { margin-bottom: 1rem }`
- M7: `.card-content { padding-top: 2rem; padding-bottom: 2rem }`
- M8: `.card { background-color: var(--background-color) }`
- M4: Change `900px` → `1024px`
- P2: Add `letter-spacing: 0.03em` to headings
- P5: `.music-player-icon svg { fill: var(--text-color) }`
- P6: Remove `!important` from `html, body` font-family rule
- P7: Replace member card overlay fixed positioning with flexbox

**`theme-joe.css`** (global — affects all pages in joe theme):
- C4: Set `--link-color: rgb(200 200 140)`
- M1: Remove `--dark-color`, `--section-color1`, `--section-color2`
- P6: Add full fallback chain: `--body-font-family: 'Edit Undo Brk', 'Helvetica', 'Arial', sans-serif`

**`theme-first.css`** (global — affects first theme):
- M1: Remove `--dark-color`, `--section-color1`, `--section-color2`
- P6: Add full fallback chain to font variables

**Page templates** (local changes):
- C3: Replace `is-size-*` on headings with proper `h1.title`/`h2.title` + Bulma size classes where needed
- M5: Standardize title structure to `div.content > h1.title` across `productions.liquid`, `graphics.liquid`, `music.liquid`, `members.liquid`, `news.liquid`, `about.liquid`
- M9: `news-post.liquid` — change `h1.is-size-2` → `h2.title`
- M10: `news-post.liquid` — replace `has-text-grey` with lighter grey
- P3: `footer.liquid` — update year to current/dynamic
- P4: Standardize icon spacing (align modal `mx-3` with header/footer `mr-4`)

### Step 4: Risk Assessment

| Risk Level | Changes |
|---|---|
| **Low** (pure cosmetic, no layout shift) | C1, C2, M1, M2, M6, M8, M9, M10, P2, P3, P4, P5 |
| **Medium** (affects layout or spacing) | C4, M3, M4, M7, C3, M5, P7 |
| **High** (could break responsiveness) | None — all proposals are conservative |

---

## Decisions (Resolved)

1. **C1/C2 (Font weight)**: Use `400`. Verify nav + footer sizing visually after change.
2. **C3 (Font-size system)**: Standardize on Bulma `is-size-*`. Remove custom heading size properties.
3. **C4 (Link distinction)**: Distinct warm off-white `rgb(200 200 140)`, glow hover stays.
4. **M1 (Dead variables)**: Remove all three.
5. **M2 (Hover color)**: Wire up `--link-hover-color` in `a:hover` rule.
6. **M7 (Card padding)**: Use `2rem`.
7. **P6 (Font fallback)**: Remove `!important`, add full fallback chains in theme variable definitions.
8. **All other items**: Approved as proposed.
