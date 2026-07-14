# TRSI.org — 2026 Redesign Implementation Plan

**Status:** Implemented on `feature/redesign-2026`. See §11 for what changed during the build.
**Reference:** design mockup `signal-2026-07-14-18-09-26-207.jpg` (1170 × 3072 px full-page render)

---

## 1. Executive summary

The mockup is a **structural** redesign, not a re-skin. Roughly 30% of it can be done in CSS alone; the rest needs template and data changes. Concretely:

| Area | Change | CSS only? |
|---|---|---|
| Colour palette, type, spacing | New token layer | ✅ |
| Alternating full-bleed section backgrounds | `.site-container` currently clamps *everything* to 1200px, so sections cannot bleed | ❌ layout shell |
| Card layout (meta **below** image, not overlaid) | Current `.card-content` is `position:absolute` over the image | ⚠️ CSS + markup reorder |
| Orange date on every card | Date is **not rendered anywhere today** (it's commented out in `feed-news.liquid:20`) | ❌ new field + filter |
| Hero image slider | Does not exist. **No CMS image is wide enough** (see §3, D1) | ❌ new component + CMS work |
| "Latest Music" homepage section | Does not exist; Music is a hidden nav item | ❌ new section |
| Inline waveform music player in cards | Player only exists inside the modal today | ❌ new component |
| Header/footer logos | Currently a text brand ("Back to the…Roots") | ❌ markup + assets from you |

There are also **five latent bugs** the research turned up that the redesign should sweep up (§4).

**Recommended sequencing:** 9 phases, each independently shippable and testable. Phases 0–4 get you the mockup's static layout. Phase 5 is the hero (blocked on a CMS decision). Phase 6 is the inline player (the largest single piece of new JS).

---

## 2. Design specification — measured from the mockup

Everything below was **sampled from the mockup pixels**, not eyeballed. The mockup is 1170 px wide; the content container in it measures 878 px (75% of the frame). All "real" values below are scaled to a **1200 px content container** (scale factor ×1.367), which lands on clean numbers and matches the existing `--site-container: 1200px`.

### 2.1 Colour

| Token | Value | Where measured | Contrast |
|---|---|---|---|
| `--color-bg` | `#000000` | hero/news/graphics/footer bands | — |
| `--color-bg-alt` | `#222222` | productions + music bands (y 1264–1782, 2304–2818) | — |
| `--color-surface` | `#19161D` | music player widget background | — |
| `--color-text` | `#FFFFFF` | headings, card titles, active nav | 21:1 on bg |
| `--color-text-muted` | `#B3B3B3` | teasers, card subtitles | 10.0:1 on `#000`, 7.6:1 on `#222` |
| `--color-text-dim` | `#A7A7A7` | inactive nav links | 8.6:1 on `#000` |
| `--color-text-faint` | `#9E9E9E` | footer tagline | 7.4:1 on `#000` |
| `--color-accent` | `#E8A03C` | card dates | 9.5:1 on `#000`, 7.2:1 on `#222` |
| `--color-brand` | `#FF7B00` | TRSI logo orange | — |
| `--color-wave` | `#C93B2F` | music waveform | — |

**All text/background pairs clear WCAG AA (4.5:1) and most clear AAA (7:1).**

> ⚠️ **`--color-accent` needs your confirmation.** The date text is small and JPEG-antialiased against black, so the sampled pixels are darkened mixtures. What is reliable is the **hue: 37–39°** (measured consistently across all four date rows). `#E8A03C` is my reconstruction at that hue. The logo orange is a distinctly redder `#FF7B00` (hue 29°). When you send the logo files I'll resample and lock this in — it's a one-line token change.

### 2.2 Layout

| Property | Mockup (1170 px frame) | Token @ 1200 px container |
|---|---|---|
| Content container | 878 px (x 146→1023) | `--container: 1200px` |
| Hero container | 1047 px (x 61→1107) | `--container-wide: 1440px` |
| Card grid | 3 × 277 px, gap 24 px | `repeat(3, 1fr)`, `--grid-gap: 2rem` |
| Section padding (block) | 88 px top & bottom | `--section-pad: 7.5rem` (120 px) |
| Heading → grid gap | 30 px | `--space-2xl: 3rem` |
| Image → text gap | 25 px | `--space-lg: 1.5rem` |

The grid maths check out exactly: `(1200 − 2×32) / 3 = 378.7 px` per card, and `277 × 1.367 = 378.7`. ✅

### 2.3 Aspect ratios

| Element | Measured | Token |
|---|---|---|
| Hero | 1047 × 582 = **1.799** | `--ratio-hero: 16 / 9` |
| News card image | 277 × 177 = **1.565** | `--ratio-news: 16 / 10` |
| Production / graphics card image | 277 × 218 = **1.271** | `--ratio-card: 5 / 4` |

> The hero was first measured as 1.618 by scanning the full frame width for the
> topmost non-black pixel. That scan hit the mockup's own **nav text** (y 55–70),
> not the image. Re-scanning in columns clear of the nav (x = 70, 100, 1060, 1090)
> gives a consistent top edge of y = 121 and a true ratio of **16:9**.

### 2.4 Typography

The mockup uses a clean grotesque throughout — **not** the current `Edit Undo Brk` pixel font or `Passero One`. Section headings are heavy, uppercase, with a subtle light-grey extrude/3D shadow.

**Recommendation: use Roboto for everything.** `src/fonts/Roboto-Variable.ttf` is *already in the repo* (unused by the active theme) and its `wght` axis covers 100–900, so we get the heavy display weight and the light body weight from one file. Zero new dependencies.

| Role | Size @1200 | Weight | Treatment |
|---|---|---|---|
| Section heading (`LATEST NEWS`) | 2.5rem / 40px | 800 | uppercase, `ls: 0.005em`, 3D text-shadow |
| Page title (`Productions`) | 3rem / 48px | 800 | uppercase |
| Card title | 1.125rem / 18px | 500 | sentence case |
| Card subtitle (`Amiga OCS – Demo`) | 0.875rem / 14px | 400 | `--color-text-muted` |
| Card date (`APRIL 5, 2026`) | 0.75rem / 12px | 600 | uppercase, `ls: 0.1em`, accent |
| Teaser | 0.875rem / 14px | 400 | `lh: 1.6`, clamped to 3 lines |
| Nav link | 0.9375rem / 15px | 400/500 | sentence case |
| Footer tagline | 0.75rem / 12px | 400 | uppercase, `ls: 0.3em` |

> **Bug in `fonts.css` today:** Roboto is declared `font-weight: normal`. For a variable font that tells the browser only 400 exists, so any bold would be *synthesised* (smeared) instead of using the `wght` axis. Must become `font-weight: 100 900`. See Phase 2.

Alternates if you want more punch on headings: **Archivo Black**, **Anton**, or **Inter** (weight 900). Swapping is a one-token change (`--font-display`).

---

## 3. Decisions I need from you (blocking)

### D1 — Hero images: where do they come from? 🔴 **Blocks Phase 5**

**The mockup's hero cannot be built from existing CMS data.** I checked every post image:

| Post | Source image dimensions |
|---|---|
| `trsi--revision-2025` | 512 × 512 |
| `hello-world` | 1059 × 1059 |
| `when-history-meets-now` | 688 × 688 |
| `boom-party-report` | **391 × 391** |
| `romaexe-party-in-june-2026` | 1200 × 630 |
| `new-release-type-in-master-tim-for-cpc` | 768 × 540 |

Four of six are **square**; the smallest is 391 px wide. The hero needs ~1440 px at 16:10. There is no wide/editorial crop anywhere in the space, and no `hero` image derivative is generated.

**Options:**

- **(A) — Recommended. New `heroSlide` content type in Contentful.** Fields: `image` (wide asset), `title`, `caption` (optional), `link` (optional), `order` (int). The mockup's hero has **no text overlay** — it's a pure image carousel — so a dedicated type is cleanest and gives editors direct control without coupling the hero to news. Cost: one Contentful model change + one transform script.
- **(B) — Add a `heroImage` asset field to the existing `posts` type**, and build the slider from posts that have one (falls back to hiding the slide). Less new machinery; couples hero to news forever.
- **(C) — No CMS change: reuse the 3 productions already tagged `featured`** (`Megademo`, `Wicked Sensation`, `Fallen Heroes`). Works today with zero Contentful edits, but they're 4:3 screenshots, not the wide party photo in the mockup. Would look noticeably different.

I'll write `src/_data/hero.js` as a single swappable data source either way, so this decision is cheap to change later — but it must be made before Phase 5 lands.

Either way we **must add a `hero` image derivative** (1600 px + 900 px) to `copyImageAssets.js` — see Phase 1.

### D2 — Inline music player: how far do we go? 🟡 **Scopes Phase 6**

Good news: I dug into `scriptprocessor_player.js` and the engine already exposes everything we need — `getCurrentPlaytime()`, `getPlaybackPosition()` / `getMaxPlaybackPosition()` / `seekPlaybackPosition()`, and it **already creates an `AnalyserNode`** in the audio graph. So a real, seekable, live-visualising card player is achievable.

The one thing that is *not* achievable cheaply: the **static full-track waveform** shown in the mockup. Tracker/SID/UADE formats are synthesised in real time — there is no decoded PCM buffer to draw peaks from until the track has actually played through. Options:

- **(A) — Recommended.** Decorative bar pattern before play (deterministic, seeded from the track title so each card looks distinct and stable), swapped for a **live oscilloscope** from the `AnalyserNode` during playback. Real elapsed/total time and click-to-seek work fully. Visually ~95% of the mockup.
- **(B)** Offline-render each track to PCM in a Web Worker on first play to compute true peaks. Correct, but adds seconds of latency and a lot of code.
- **(C)** Ship Phase 6 as "card art + play button" styled to the mockup, defer the waveform entirely.

### D3 — Navigation and the orphaned About page 🟡

The mockup's nav is **Home · News · Members · Productions · Graphics · Music**. That means three changes: add `Home`, reorder, and **un-hide `Music`** (today it's `hidden: true` in `navdata.json`, revealed only via `?mode=wotw`).

It also means: the new homepage has **no link to `/about/`**. Today the only link is the "(read more…)" in the homepage intro paragraph, which the hero replaces. **`/about/` would become unreachable.** My recommendation: add **About** to the footer. Confirm you're happy with that (or that you want it in the main nav, making it 7 items).

### D4 — Bulma 🟢 (my call unless you object)

The new design shares almost nothing with Bulma, and the current CSS spends most of its effort fighting `--bulma-*` overrides. But Bulma's modal (`.modal`, `.is-active`, `.modal-background`) is load-bearing for the card→modal flow.

**Plan: keep Bulma this pass, but write all new CSS with zero Bulma dependency**, so a follow-up PR can delete it in one move. Removing it mid-redesign multiplies risk for a small bundle win (PurgeCSS already strips ~90% of it).

### D5 — Legacy themes 🟢

`theme-joe.css` and `theme-first.css` are *palette* variants that assume the current *structure* (absolute-positioned card overlays, 1200px-clamped container). They cannot survive a structural redesign. I'll retire them and make `theme-2026.css` palette-only. **Rollback is the git branch, not a theme flag** — which is the right tool for a redesign anyway.

---

## 4. Bugs to sweep up

Found during research. All are cheap to fix while we're in these files, and three of them actively affect the redesign.

| # | File | Bug | Impact on redesign |
|---|---|---|---|
| B1 | `news-post.liquid:14` | Renders `{{ post.date }}` — posts have **no `date` field** (it's `publishDate`). Every article page shows an empty date line. | Direct — we're adding dates everywhere |
| B2 | `og-tags.liquid:3` | `post.image \| default: site.metadata.seoimage` — posts have no `image` field (it's `post_image`). **Every page falls back to the generic logo** for its social card. | Should fix — no article ever gets its own share image |
| B3 | `utils.js:155-160` | All five modal action buttons share one parent `.column`; the loop sets `button.parentElement.style.display` per button, so the **last** button (Kestra) decides the whole row. A production with a Demozoo link but no Kestra link gets the **entire button row hidden**. | Fix — it's visibly broken |
| B4 | `utils.js:79` | `$card.querySelector('.card-image img').src` — no null guard, but `card-music.liquid:15` and `card-graphics.liquid:12` wrap `.card-image` in `{% if card.asset %}`. A card without an asset **throws on click**. | Fix |
| B5 | `utils.js:244-245` | `handleFilterChange` reads `.value` on **both** `#TypeFilter` and `#PlatformFilter` unconditionally → TypeError on any page rendering only one. | Fix — latent trap |
| B6 | `copyImageAssets.js:47` | `if (contentType == ('image/png' \|\| 'image/jpg' \|\| …))` — the `\|\|` chain short-circuits to `'image/png'`, so it only ever compares against PNG. Logging-only, harmless. | Optional |
| B7 | `transformProductions.js:39` | If a production lacks `youTubeUrl`, `getYtId(null)` throws and **crashes the whole build**. Latent (all 91 have one today). | Optional but cheap |
| B8 | pipeline | `/img/post/` (480px, 242 files, ~4 MB) is generated and **referenced by nothing**. | We'll repurpose it for news `srcset` |
| B9 | `copyImageAssets.js:60` | Output filenames keep literal spaces (`/img/card/Wodk Amiga.webp`) and are emitted raw into `src=""` unencoded. | Fix — URL-encode |
| B10 | `card-*.liquid` | Hardcoded `width="800" height="600"` on every card image, but real derivatives are 800×450 … 800×923 → **CLS**. | Fixed for free by `aspect-ratio` on the container |

Also worth knowing: **`CLAUDE.md` is wrong** where it says images are "card/400px, post/150px". The code says **800** and **480**. I'll correct it.

---

## 5. DOM contracts that must not break

`utils.js` and `main.js` are string-coupled to the markup in ways that are easy to break silently. This is the full list — the new templates preserve every one of them, and where I *do* change one, the required JS diff is given in the phase.

| Hook | Used by | New markup |
|---|---|---|
| `.card.pointer` | `main.js:54` — the click→modal binding | **Preserved** on prod/graphics/music cards |
| `.card-content .title`, `.card-content .subtitle` | `utils.js:73,77` — read via `innerText` into the modal | **Preserved** — the new below-image block keeps these exact class names |
| `.card-image img` | `utils.js:79` — `.src` read (no null guard, see B4) | **Preserved** |
| `data-ctype`, `data-slug`, `data-youtube`, `data-demozoo`, `data-csdb`, `data-pouet`, `data-download`, `data-credits`, `data-description`, `data-image`, `data-asset`, `data-format`, `data-kestra` | `utils.js:69-93` | **Preserved verbatim** |
| `data-release_date` (underscore!), `data-playeremu` (all-lowercase) | `utils.js` — non-standard casing | **Preserved verbatim — do not "tidy" these** |
| Modal action buttons matched by **lowercased `innerText`** (`youtube`/`demozoo`/`csdb`/`pouet`/`download`/`kestra`) | `utils.js:142-153` | **Do not rename the button labels** |
| `#modal-overlay`, `#modal-video`, `#modal-image`, `#modal-description`, `#modal-credits`, `#modal-release_date` | `utils.js` | Preserved |
| `#music-player-overlay`, `#play-pause-btn`, `#play-icon`, `#pause-icon` | `utils.js:292-294`; the id `play-pause-btn` is load-bearing inside **two `:not()` selectors** (`main.js:64`, `utils.js:139`) | Preserved |
| `.navbar-burger` + `data-target="navMenu"` → `#navMenu`, toggling `is-active` | `main.js:31-39` | **Preserved** — I keep `.navbar-burger` on the button and `id="navMenu"` on the menu, so the burger JS needs no change |
| `#feed-wrapper .column`, `#feed-wrapper .columns > .column` | `utils.js:240,263,266` — filter + sort targets | 🔴 **CHANGES** to `.card-grid` / `.card-grid__item` — JS diff in Phase 4 |
| `#TypeFilter`, `#PlatformFilter`, `#SortSelect` | `utils.js` | Preserved |
| `body.modal-open` + `body.style.top` scroll lock | `utils.js:16,20,35,39` | Preserved |

Two dead references, for the record: `main.js`'s docblock mentions `.js-modal-trigger` (unused — the real hook is `.card.pointer`), and the `?mode=wotw` feature flag described in `research.md` **no longer exists in `main.js`** — Music is hidden purely by the `.hide` CSS class. The docs are stale.

---

## 6. Target CSS architecture

Replace the current flat `styles.css` (385 lines of mixed tokens/layout/components) with a layered structure. PostCSS's `postcss-import` already resolves `@import`, so this costs nothing at build time.

```
src/css/
  index.css            # entry — @imports, in order:
  bulma.css            #   (unchanged, scoped to modal — see D4)
  tokens.css           # NEW — all design tokens (§2)
  fonts.css            # UPDATED — Roboto variable weight range
  base.css             # NEW — reset, body, links, focus-visible
  layout.css           # NEW — .section, .section__inner, .card-grid
  components/
    header.css         # NEW
    footer.css         # NEW
    hero.css           # NEW
    card.css           # NEW — replaces the overlay card
    section-head.css   # NEW — heading + "> Show all" link
    filters.css        # UPDATED
    modal.css          # UPDATED — extracted from styles.css
    music-card.css     # NEW — inline player (Phase 6)
  theme-2026.css       # palette-only overrides (retires theme-joe/theme-first)
```

**PurgeCSS caveat:** `postcss.config.mjs` runs PurgeCSS with `variables: true`, which **strips CSS custom properties it thinks are unused**. Tokens referenced only from JS (e.g. the waveform colour read via `getComputedStyle`) will be deleted. Phase 8 extends the safelist.

---

## 7. Implementation phases

### Phase 0 — Test infrastructure (do this first)

`package.json` lists `vitest`, `playwright`, `@testing-library/dom`, `jsdom` as devDependencies, and `README.md` documents `npm test` / `npm run test:e2e` — but **there is no test script, no config, and not a single test file in the repo.** Bootstrap it before touching anything, so every later phase lands against a green baseline.

**`package.json` — add scripts:**

```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:update": "playwright test --update-snapshots",
  "test:integration": "node tests/integration/build-check.js"
}
```

**`vitest.config.js`:**

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/unit/**/*.test.js"],
    setupFiles: ["tests/setup.js"],
    coverage: { reporter: ["text", "html"], include: ["src/js/**", "src/_filters/**"] },
  },
});
```

**`playwright.config.js`:**

```js
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  snapshotDir: "tests/e2e/__snapshots__",
  fullyParallel: true,
  webServer: {
    command: "npm run build:css && npx eleventy --serve --port=8080",
    url: "http://localhost:8080",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:8080" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "tablet",  use: { ...devices["iPad (gen 7)"] } },
    { name: "mobile",  use: { ...devices["iPhone 13"] } },
  ],
});
```

Note the `webServer` command deliberately **skips `build:content`** so tests don't hit the Contentful API. That requires `cms/data/*.json` to exist — which it does locally, but it's gitignored, so **CI needs a fixture set**. Add `tests/fixtures/cms/*.json` (a trimmed copy: 4 posts, 6 productions, 6 graphics, 6 music, 8 members) and make `src/_data/cms.js` fall back to fixtures when `cms/data/` is absent:

```js
// src/_data/cms.js — add at the top of the resolver
const DATA_DIR = existsSync(resolve(__dirname, "../../cms/data/posts.json"))
  ? resolve(__dirname, "../../cms/data")
  : resolve(__dirname, "../../tests/fixtures/cms");
```

Also add `@playwright/test` and `@axe-core/playwright` to devDependencies.

**Baseline tests to write now** (they should pass against the *current* site, then be updated as the design lands — that's the point: they catch accidental breakage):

```js
// tests/unit/dom-contracts.test.js — locks the JS↔markup coupling from §5
import { describe, it, expect, beforeEach } from "vitest";
import { getDataFromCard } from "../../src/js/utils.js";

describe("card → modal data contract", () => {
  it("reads every data-* attribute the modal needs", () => {
    document.body.innerHTML = `
      <div class="card pointer" data-ctype="prod" data-slug="roma-exe"
           data-youtube="https://www.youtube-nocookie.com/embed/abc"
           data-release_date="2026-04-05"
           data-credits='[{"name":"Madison","contribution":"Code"}]'>
        <div class="card-image"><img src="/img/card/x.webp"></div>
        <div class="card-content">
          <p class="title">All roads lead to ROMA.EXE</p>
          <p class="subtitle">Amiga OCS – Demo</p>
        </div>
      </div>`;
    const data = getDataFromCard(document.querySelector(".card"));
    expect(data.ctype).toBe("prod");
    expect(data.slug).toBe("roma-exe");
    expect(data.title).toBe("All roads lead to ROMA.EXE");
    expect(data.subtitle).toBe("Amiga OCS – Demo");
    expect(data.release_date).toBe("2026-04-05");     // underscore casing is load-bearing
    expect(JSON.parse(data.credits)[0].name).toBe("Madison");
  });

  it("does not throw when a card has no image (regression: B4)", () => {
    document.body.innerHTML = `
      <div class="card pointer" data-ctype="music" data-slug="samsara">
        <div class="card-content"><p class="title">Samsara</p><p class="subtitle">Amiga – Tracked Music</p></div>
      </div>`;
    expect(() => getDataFromCard(document.querySelector(".card"))).not.toThrow();
  });
});
```

**Exit criteria:** `npm test` and `npm run test:e2e` both run green against `main` before any redesign commit.

---

### Phase 1 — Data layer: dates, hero derivative, bug fixes

Nothing visual yet. Get the data the design needs.

#### 1a. Date display filter

Dates are ISO `YYYY-MM-DD` strings. The mockup shows `APRIL 5, 2026`.

**Do not use Liquid's built-in `date` filter.** `{{ "2026-04-05" | date: "%B %-d, %Y" }}` parses the string as **UTC midnight** and then formats in **local time** — so in any UTC-negative timezone it renders `APRIL 4`. That's a real off-by-one that would silently corrupt every date on the site depending on where the build runs.

**`src/_filters/dates.js`** (a separate module so it's unit-testable):

```js
const MONTHS = ["JANUARY","FEBRUARY","MARCH","APRIL","MAY","JUNE",
                "JULY","AUGUST","SEPTEMBER","OCTOBER","NOVEMBER","DECEMBER"];

/** "2026-04-05" → "APRIL 5, 2026". Timezone-free: parses the string, never a Date. */
export function displayDate(value) {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (!m) return "";
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month) return "";
  return `${month} ${Number(d)}, ${y}`;
}

/** "2026-04-05" → "2026-04-05", for <time datetime="…">. "" for anything invalid. */
export function isoDate(value) {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(value ?? ""));
  return m ? m[1] : "";
}
```

**`.eleventy.js`:**

```js
import { displayDate, isoDate } from "./src/_filters/dates.js";
// …
eleventyConfig.addFilter("displayDate", displayDate);
eleventyConfig.addFilter("isoDate", isoDate);
```

#### 1b. Hero image derivative

`copyImageAssets.js` currently emits exactly three derivatives — `orig` (no resize), `card` (800w), `post` (480w) — and **`post` is referenced by nothing** (B8).

Add a `hero` derivative, and put `post` back to work as the small end of a news `srcset`:

```js
// cms/scripts/copyImageAssets.js — alongside the existing card/post blocks
const heroDir = resolve(imgAssetsDest, "hero");
await mkdir(heroDir, { recursive: true });

// 1600w for the 1440px hero at ~1.1x; 900w for tablet/mobile
for (const [w, suffix] of [[1600, ""], [900, "-sm"]]) {
  await sharp(srcPath)
    .resize(w, null, { withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(resolve(heroDir, base.replace(/\.[^/.]+$/, `${suffix}.webp`)));
}
```

And **fix B9 while we're here** — filenames keep literal spaces (`/img/card/Wodk Amiga.webp`) and go into `src=""` unencoded:

```js
const webPath = (dir, name) => `/img/${dir}/${encodeURIComponent(name)}`;
```

#### 1c. Transform updates

```js
// cms/scripts/transformPosts.js
post_image:    resolve("/img/card/", webp),   // 800w — unchanged, still the default
post_image_sm: resolve("/img/post/", webp),   // 480w — for srcset (B8: finally used)
hero_image:    resolve("/img/hero/", webp),   // 1600w — only if D1 = option B
```

Plus a new `cms/scripts/transformHero.js` if D1 = option A, and `src/_data/hero.js` as the single swappable source:

```js
// src/_data/hero.js — the ONLY place the hero's data source is decided
import cms from "./cms.js";

export default function () {
  // D1 = (A): dedicated content type
  // return cms.heroSlides.sort((a, b) => a.order - b.order);

  // D1 = (C): fallback that works today with zero Contentful changes
  return cms.productions
    .filter((p) => p.tags?.includes("featured"))
    .map((p) => ({ image: p.card_image, image_sm: p.card_image, title: p.title, link: null }));
}
```

#### 1d. Bug fixes

- **B1** — `news-post.liquid:14`: `{{ post.date }}` → `{{ post.publishDate | displayDate }}`
- **B2** — `og-tags.liquid:3`: `post.image` → `post.post_image`
- **B7** — `transformProductions.js:39`: guard `getYtId(null)`

**Tests:**

```js
// tests/unit/dates.test.js
import { describe, it, expect } from "vitest";
import { displayDate, isoDate } from "../../src/_filters/dates.js";

describe("displayDate", () => {
  it("formats an ISO date the way the mockup shows it", () => {
    expect(displayDate("2026-04-05")).toBe("APRIL 5, 2026");
    expect(displayDate("2025-10-04")).toBe("OCTOBER 4, 2025");
    expect(displayDate("2026-07-10")).toBe("JULY 10, 2026");
  });

  it("does not drift across timezones (regression: the Liquid `date` filter bug)", () => {
    // Run under TZ=America/Los_Angeles via the test env; a Date-based impl would say APRIL 4.
    expect(displayDate("2026-04-05")).toBe("APRIL 5, 2026");
  });

  it("survives the empty/null dates that really exist in the data", () => {
    expect(displayDate("")).toBe("");        // productions use '' for missing
    expect(displayDate(null)).toBe("");      // graphics/music use null
    expect(displayDate(undefined)).toBe("");
    expect(displayDate("garbage")).toBe("");
  });
});
```

Set `TZ=America/Los_Angeles` in `tests/setup.js` so the timezone regression is actually exercised.

```js
// tests/integration/build-check.js — assert derivatives + no broken image refs
// 1. every img src in dist/**/*.html resolves to a file on disk (decodeURIComponent first)
// 2. dist/img/hero/ is non-empty
// 3. no dist HTML contains an unencoded space inside src="…"
```

---

### Phase 2 — CSS foundation: tokens, fonts, base

**`src/css/tokens.css`** (new):

```css
:root {
  /* ---- Surfaces (sampled from the mockup) ---- */
  --color-bg:          #000000;
  --color-bg-alt:      #222222;
  --color-surface:     #19161d;   /* music player widget */

  /* ---- Text ---- */
  --color-text:        #ffffff;
  --color-text-muted:  #b3b3b3;   /* teasers, card subtitles */
  --color-text-dim:    #a7a7a7;   /* inactive nav */
  --color-text-faint:  #9e9e9e;   /* footer tagline */

  /* ---- Brand ---- */
  --color-accent:      #e8a03c;   /* card dates — hue 37-39° measured; CONFIRM vs logo */
  --color-brand:       #ff7b00;   /* TRSI logo orange */
  --color-wave:        #c93b2f;   /* music waveform */

  --color-link:        var(--color-text);
  --color-link-hover:  var(--color-accent);
  --color-border:      rgb(255 255 255 / 0.12);
  --color-focus:       var(--color-accent);

  /* ---- Type ---- */
  --font-body:    "Roboto", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  --font-display: var(--font-body);

  --fs-page-title: clamp(2rem,   1.4rem + 2.6vw, 3rem);
  --fs-display:    clamp(1.75rem, 1.2rem + 2.2vw, 2.5rem);
  --fs-card-title: 1.125rem;
  --fs-body:       1rem;
  --fs-meta:       0.875rem;
  --fs-eyebrow:    0.75rem;
  --fs-nav:        0.9375rem;

  --fw-display: 800;
  --fw-title:   500;
  --fw-eyebrow: 600;
  --fw-body:    400;

  --lh-tight: 1.2;
  --lh-body:  1.6;
  --ls-display: 0.005em;
  --ls-eyebrow: 0.1em;
  --ls-tagline: 0.3em;

  /* ---- Space ---- */
  --space-2xs: 0.25rem;  --space-xs: 0.5rem;   --space-sm: 0.75rem;
  --space-md:  1rem;     --space-lg: 1.5rem;   --space-xl: 2rem;
  --space-2xl: 3rem;     --space-3xl: 4.5rem;

  /* ---- Layout (see §2.2 — derived from the mockup) ---- */
  --container:      1200px;
  --container-wide: 1440px;
  --gutter:     clamp(1rem, 4vw, 3rem);
  --grid-gap:   2rem;
  --section-pad: clamp(3rem, 8vw, 7.5rem);

  /* ---- Media ratios (§2.3) ---- */
  --ratio-hero: 16 / 10;
  --ratio-news: 16 / 10;
  --ratio-card: 5 / 4;

  /* ---- Motion ---- */
  --dur-fast: 150ms;  --dur: 300ms;  --dur-slow: 600ms;
  --ease: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 0ms; --dur: 0ms; --dur-slow: 0ms; }
}
```

**`src/css/fonts.css`** — fix the variable-font declaration (see §2.4):

```css
@font-face {
  font-family: "Roboto";
  src: url("../fonts/Roboto-Variable.woff2") format("woff2");
  font-weight: 100 900;          /* was `normal` — the wght axis was unreachable */
  font-style: normal;
  font-display: swap;
}
```

Convert the TTF once (it's ~2× smaller as woff2, and it's on the critical path):

```bash
npx ttf2woff2 < src/fonts/Roboto-Variable.ttf > src/fonts/Roboto-Variable.woff2
```

Keep the `Edit Undo Brk` / `Passero One` `@font-face` blocks in the file — unreferenced `@font-face` rules are never downloaded, so they cost nothing and keep the legacy themes readable in git history.

Preload it in `base.liquid`:

```html
<link rel="preload" href="/fonts/Roboto-Variable.woff2" as="font" type="font/woff2" crossorigin>
```

**`src/css/base.css`** (new) — replaces the top of `styles.css`:

```css
*, *::before, *::after { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  -webkit-font-smoothing: antialiased;
}

main { flex: 1; }               /* sticky footer — replaces `.site-container section:last-of-type` */

img { max-width: 100%; display: block; }

a { color: var(--color-link); text-decoration: none; }
a:hover { color: var(--color-link-hover); }

:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 3px;
}

body.modal-open { overflow: hidden; position: fixed; width: 100%; }  /* keep — utils.js scroll lock */
```

**`src/css/layout.css`** (new) — this is what unlocks the full-bleed alternating backgrounds:

```css
.section {
  padding-block: var(--section-pad);
  background: var(--color-bg);
}
.section--alt { background: var(--color-bg-alt); }

.section__inner {
  width: min(100% - (var(--gutter) * 2), var(--container));
  margin-inline: auto;
}
.section__inner--wide {
  width: min(100% - (var(--gutter) * 2), var(--container-wide));
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--grid-gap);
}
@media (width < 900px)  { .card-grid { grid-template-columns: repeat(2, 1fr); } }
@media (width < 600px)  { .card-grid { grid-template-columns: 1fr; } }
```

---

### Phase 3 — Layout shell: base, header, footer

#### 3a. `base.liquid` — remove the container that blocks full-bleed

The single most important structural change. Today **`.site-container` wraps header, content *and* footer in a `max-width: 1200px` box**, so no section can bleed to the viewport edge. Each section must own its own inner container instead.

```liquid
  <body>
{% include "sections/header.liquid" %}
    <main id="main">
{{ content }}
    </main>
{% include "sections/footer.liquid" %}
  </body>
```

Also add a skip link as the first focusable element (a11y, and cheap):

```html
<a class="skip-link" href="#main">Skip to content</a>
```

#### 3b. `header.liquid`

Logo left · nav centred · social right, all on the 1200px container. **The burger contract is preserved exactly** (`.navbar-burger` + `data-target="navMenu"` → `#navMenu`, toggling `is-active`), so `main.js:31-39` needs no change. Note the menu keeps `id="navMenu"` but **drops the `navbar-menu` class** so Bulma's own `display:none` / breakpoint rules don't fight the new CSS.

```liquid
<header class="site-header">
  <div class="site-header__inner section__inner">
    <a class="site-header__brand" href="/" aria-label="TRSI — home">
      <img src="/img/logo-header.svg" alt="" width="120" height="48">
    </a>

    <a role="button" class="navbar-burger" aria-label="Open menu" aria-expanded="false" data-target="navMenu">
      <span aria-hidden="true"></span><span aria-hidden="true"></span>
      <span aria-hidden="true"></span><span aria-hidden="true"></span>
    </a>

    <div class="site-nav" id="navMenu">
      <nav class="site-nav__list" aria-label="Main">
        {%- for item in nav.nav_items %}
        {%- assign slug = item.title | downcase %}
        {%- assign is_current = false %}
        {%- if page.fileSlug == slug %}{% assign is_current = true %}{% endif %}
        {%- if item.url == "/" and page.fileSlug == "" %}{% assign is_current = true %}{% endif %}
        <a href="{{ item.url }}"
           class="site-nav__link{% if is_current %} is-current{% endif %}"
           {% if is_current %}aria-current="page"{% endif %}>{{ item.title }}</a>
        {%- endfor %}
      </nav>
      {%- render "components/social-links.liquid", modifier: "site-header__social" %}
    </div>
  </div>
</header>
```

The social icon block is duplicated **four times** today (header, footer, about, and again in header). Extract it once:

```liquid
{%- comment %} src/_includes/components/social-links.liquid {%- endcomment %}
<ul class="social-links {{ modifier }}">
  {%- for item in social.nav_items %}
  <li>
    <a href="{{ item.url }}" target="_blank" rel="noopener"
       class="social-links__link" aria-label="TRSI on {{ item.name }}">
      {%- assign icon = "icons/" | append: item.name | downcase | append: ".svg" %}
      {%- include icon %}
    </a>
  </li>
  {%- endfor %}
</ul>
```

⚠️ This requires `social.json`'s order to match the mockup (Instagram, Facebook, X, YouTube) — it's currently Facebook, YouTube, X, Instagram. Reorder it.

**`navdata.json`** — per D3, add Home, reorder, un-hide Music:

```json
{
  "nav_items": [
    { "title": "Home",        "url": "/" },
    { "title": "News",        "url": "/news" },
    { "title": "Members",     "url": "/members" },
    { "title": "Productions", "url": "/productions" },
    { "title": "Graphics",    "url": "/graphics" },
    { "title": "Music",       "url": "/music" }
  ]
}
```

**`src/css/components/header.css`:**

```css
.site-header { background: var(--color-bg); padding-block: var(--space-lg); }

.site-header__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
}

.site-nav { display: contents; }          /* desktop: children participate in the flex row */

.site-nav__list { display: flex; gap: var(--space-lg); }

.site-nav__link {
  font-size: var(--fs-nav);
  color: var(--color-text-dim);
  transition: color var(--dur-fast) var(--ease);
}
.site-nav__link:hover      { color: var(--color-text); }
.site-nav__link.is-current { color: var(--color-text); font-weight: 500; }

.social-links { display: flex; gap: var(--space-sm); list-style: none; margin: 0; padding: 0; }
.social-links__link svg { width: 18px; height: 18px; fill: var(--color-text); display: block; }
.social-links__link:hover svg { fill: var(--color-accent); }

.navbar-burger { display: none; }

@media (width < 900px) {
  .navbar-burger { display: block; }      /* keep the class — main.js binds to it */
  .site-nav {
    display: none;
    flex-direction: column;
    gap: var(--space-lg);
    width: 100%;
    padding-block: var(--space-lg);
  }
  .site-nav.is-active { display: flex; }  /* main.js toggles `is-active` on #navMenu */
  .site-nav__list { flex-direction: column; gap: var(--space-md); }
}
```

Small JS improvement — keep `aria-expanded` honest (`main.js:31-39`):

```js
el.addEventListener("click", () => {
  const $target = document.getElementById(el.dataset.target);
  if (!$target) return;                                   // guard: currently throws if absent
  const open = el.classList.toggle("is-active");
  $target.classList.toggle("is-active", open);
  el.setAttribute("aria-expanded", String(open));
});
```

#### 3c. `footer.liquid`

Year range left · logo + tagline centre · social right.

```liquid
<footer class="site-footer">
  <div class="site-footer__inner section__inner">
    <p class="site-footer__years">1990 &ndash; {{ "now" | date: "%Y" }}</p>

    <div class="site-footer__brand">
      <img src="/img/logo-footer.svg" alt="TRSI" width="280" height="70">
      <p class="site-footer__tagline">The Sleeping Gods</p>
    </div>

    {%- render "components/social-links.liquid", modifier: "site-footer__social" %}
  </div>
  <nav class="site-footer__links" aria-label="Secondary">
    <a href="/about/">About</a>          {%- comment %} D3: keeps /about/ reachable {%- endcomment %}
  </nav>
</footer>
```

```css
.site-footer { background: var(--color-bg); padding-block: var(--space-3xl); }
.site-footer__inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--space-lg);
}
.site-footer__years {
  font-size: var(--fs-eyebrow);
  letter-spacing: var(--ls-eyebrow);
  color: var(--color-text);
  text-transform: uppercase;
}
.site-footer__brand   { text-align: center; }
.site-footer__tagline {
  margin-top: var(--space-sm);
  font-size: var(--fs-eyebrow);
  letter-spacing: var(--ls-tagline);
  text-transform: uppercase;
  color: var(--color-text-faint);
}
.site-footer__social { justify-content: flex-end; }

@media (width < 700px) {
  .site-footer__inner { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .site-footer__social { justify-content: center; }
}
```

**Assets needed from you:** `logo-header.svg` (~120×48) and `logo-footer.svg` (~280×70). SVG preferred; if raster, supply @2x WebP. They go in `src/public/img/`.

---

### Phase 4 — Section heads and the card system

This is the heart of the redesign.

#### 4a. Section head

```liquid
{%- comment %} src/_includes/components/section-head.liquid {%- endcomment %}
<header class="section-head{% if align == 'center' %} section-head--center{% endif %}">
  <h2 class="section-head__title" id="{{ id }}">{{ title }}</h2>
  {%- if more_url %}
  <a class="section-head__more" href="{{ more_url }}">{{ more_label }}</a>
  {%- endif %}
</header>
```

```css
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-lg);
  margin-bottom: var(--space-2xl);
}
.section-head--center { justify-content: center; }

.section-head__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--fs-display);
  font-weight: var(--fw-display);
  line-height: var(--lh-tight);
  letter-spacing: var(--ls-display);
  text-transform: uppercase;
  color: var(--color-text);
  /* the subtle grey extrude in the mockup */
  text-shadow:
    1px 1px 0 #6b6b6b,
    2px 2px 0 #4a4a4a,
    3px 3px 0 #303030,
    4px 4px 6px rgb(0 0 0 / 0.5);
}

.section-head__more {
  flex: none;
  font-size: var(--fs-meta);
  color: var(--color-text-muted);
}
.section-head__more::before { content: "> "; }   /* literal '>' in the mockup */
.section-head__more:hover { color: var(--color-text); }
```

#### 4b. The card — meta moves below the image

**The critical change.** Today `.card-content` is `position: absolute` with a gradient overlay *on top of* the image, and `.bounce-hover` slides it up on hover. The mockup puts date/title/subtitle **below** the image on the section background, with no overlay.

Markup order in the mockup is **image → DATE → TITLE → SUBTITLE**. Today it's subtitle-then-title, and there is no date at all.

`card-productions.liquid` (graphics and music are the same shape):

```liquid
<article class="card pointer"
  data-ctype="prod"
  {{- if card.title }}data-slug='{{ card.title | slugify }}'{{- endif }}
  {{- if card.youtube }}data-youtube='{{ card.youtube }}'{{- endif }}
  {{- if card.demozoo }}data-demozoo='{{ card.demozoo }}'{{- endif }}
  {{- if card.csdb }}data-csdb='{{ card.csdb }}'{{- endif }}
  {{- if card.pouet }}data-pouet='{{ card.pouet }}'{{- endif }}
  {{- if card.credits }}data-credits='{{ card.credits | jsonify }}'{{- endif }}
  {{- if card.release_date }}data-release_date='{{ card.release_date }}'{{- endif }}
  tabindex="0" role="button"
  aria-label="{{ card.title }} — open details">

  <div class="card-image">
    <img src="{{ card.card_image }}"
         alt="{{ card.type }} {{ card.title }} on {{ card.platform }}"
         width="800" height="640" loading="lazy" decoding="async">
  </div>

  <div class="card-content">
    {%- if card.release_date %}
    <p class="card__date">
      <time datetime="{{ card.release_date | isoDate }}">{{ card.release_date | displayDate }}</time>
    </p>
    {%- endif %}
    <p class="title">{{ card.title }}</p>
    <p class="subtitle">{{ card.platform }} &ndash; {{ card.type }}</p>
  </div>
</article>
```

Three things to notice:

1. **`.card.pointer`, `.card-image img`, `.card-content .title`, `.card-content .subtitle` and every `data-*` are preserved** — including the odd `data-release_date` underscore. So `utils.js`'s modal population needs **zero changes**. The class names stay; only their *styling* and *position in the DOM* change.
2. The subtitle is now `platform – type` (mockup: `Amiga OCS – Demo`), **reversed** from today's `type / platform`.
3. `tabindex="0" role="button"` — cards are click targets but were never keyboard-reachable. Add an `Enter`/`Space` handler in `main.js` alongside the existing click binding.

> ❓ **Open question:** the mockup renders graphics subtitles as `C64 Pixelart` and `Amiga OCS Pixelart` — **no dash** — while productions and music both show one (`Amiga OCS – Demo`, `Amiga – Tracked Music`). I've assumed that's a mockup inconsistency and used the dash everywhere. Say the word if graphics should genuinely differ.

`card-news.liquid` (new — news cards are **links**, not modal triggers, so no `.pointer`):

```liquid
<article class="card card--news">
  <a class="card__link" href="/news/{{ item.slug }}/">
    <div class="card-image card-image--news">
      <img src="{{ item.post_image }}"
           srcset="{{ item.post_image_sm }} 480w, {{ item.post_image }} 800w"
           sizes="(width < 600px) 90vw, (width < 900px) 45vw, 380px"
           alt="" width="800" height="500"
           loading="{% if forloop.first %}eager{% else %}lazy{% endif %}" decoding="async">
    </div>
    <div class="card-content">
      <p class="card__date">
        <time datetime="{{ item.publishDate | isoDate }}">{{ item.publishDate | displayDate }}</time>
      </p>
      <h3 class="title card__title">{{ item.title }}</h3>
      <p class="card__teaser">{{ item.teaser }}</p>
      <span class="card__more">continue reading</span>
    </div>
  </a>
</article>
```

`alt=""` is deliberate: the image sits inside a link whose text already names the post, so a description would be announced twice.

**`src/css/components/card.css`:**

```css
.card {
  display: flex;
  flex-direction: column;
  background: transparent;      /* was var(--background-color) */
  border-radius: 0;
}
.card.pointer { cursor: pointer; }
.card__link { display: flex; flex-direction: column; height: 100%; color: inherit; }

.card-image {
  aspect-ratio: var(--ratio-card);
  background: #000;             /* letterbox for non-conforming art */
  overflow: hidden;
}
.card-image--news { aspect-ratio: var(--ratio-news); }

.card-image img { width: 100%; height: 100%; }

/* Demoscene art must never be cropped — letterbox it. Photos crop fine. */
.card[data-ctype="prod"]    .card-image img,
.card[data-ctype="graphic"] .card-image img { object-fit: contain; }
.card--news .card-image img,
.card[data-ctype="member"] .card-image img { object-fit: cover; }

/* The overlay is gone: static block, on the section background. */
.card-content {
  position: static;
  background: none;
  width: auto;
  height: auto;
  padding: var(--space-lg) 0 0;
}

.card__date {
  margin: 0 0 var(--space-xs);
  font-size: var(--fs-eyebrow);
  font-weight: var(--fw-eyebrow);
  letter-spacing: var(--ls-eyebrow);
  text-transform: uppercase;
  color: var(--color-accent);
}

.card .title {
  margin: 0 0 var(--space-2xs);
  font-size: var(--fs-card-title);
  font-weight: var(--fw-title);
  line-height: var(--lh-tight);
  color: var(--color-text);
}

.card .subtitle {
  margin: 0;
  font-size: var(--fs-meta);
  color: var(--color-text-muted);
}

.card__teaser {
  margin: var(--space-sm) 0 var(--space-md);
  font-size: var(--fs-meta);
  line-height: var(--lh-body);
  color: var(--color-text-muted);
  display: -webkit-box;
  -webkit-line-clamp: 3;        /* mockup truncates at 3 lines with an ellipsis */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__more { font-size: var(--fs-meta); color: var(--color-text); }
.card__more::before { content: "> "; }

.card:hover .card-image img { transform: scale(1.03); }
.card-image img { transition: transform var(--dur) var(--ease); }
.card:hover .title { color: var(--color-accent); }
```

Note `.bounce-hover`, `.aligned-vertically` and `--lift-height` all die with the overlay. Remove them from the templates and CSS.

#### 4c. `feed-cards.liquid` — Bulma columns → CSS grid

```liquid
{%- assign items = max | default: feed.size %}
{%- assign sort_key = sort_key | default: "release_date" %}
{%- assign sort_order = sort_order | default: "desc" %}
{%- assign sorted_feed = feed | sort: sort_key %}
{%- if sort_order == "desc" %}{% assign sorted_feed = sorted_feed | reverse %}{% endif %}
{%- assign sliced_feed = sorted_feed | slice: 0, items %}
{%- assign card_template = "components/card-" | append: type | downcase | append: ".liquid" %}

<div class="card-grid">
  {%- for item in sliced_feed %}
  <div class="card-grid__item"
    data-type="{{ item.type | downcase }}"
    data-date="{{ item.release_date }}"
    data-platform="{{ item.platform | downcase }}"
    data-status="{{ item.member_status | downcase }}"
    data-sort-handle="{{ item.sort_handle }}">
    {%- render card_template, card: item %}
  </div>
  {%- endfor %}
</div>
```

🔴 **This is the one place the redesign breaks a JS contract.** `utils.js` currently queries `#feed-wrapper .column` and `#feed-wrapper .columns > .column`. Required diff:

```diff
  // utils.js — handleFilterChange (~line 240)
- const cards = document.querySelectorAll("#feed-wrapper .column");
- const typeValue = document.getElementById("TypeFilter").value;
- const platformValue = document.getElementById("PlatformFilter").value;
+ const cards = document.querySelectorAll("#feed-wrapper .card-grid__item");
+ // B5: members renders neither filter; productions/graphics/music render both.
+ const typeValue = document.getElementById("TypeFilter")?.value ?? "";
+ const platformValue = document.getElementById("PlatformFilter")?.value ?? "";

  // utils.js — sort (~lines 263-266)
- const container = document.querySelector("#feed-wrapper .columns");
- const items = [...container.querySelectorAll(":scope > .column")];
+ const container = document.querySelector("#feed-wrapper .card-grid");
+ const items = [...container.querySelectorAll(":scope > .card-grid__item")];
```

The `:scope >` direct-child requirement stays — **do not wrap cards in an extra div** or sorting silently stops working.

#### 4d. `index.liquid` — the new homepage

```liquid
---
layout: layouts/base.liquid
title: TRSI
tags: page
---
{%- render "sections/hero.liquid", slides: hero %}

<section class="section" aria-labelledby="h-news">
  <div class="section__inner">
    {%- render "components/section-head.liquid", title: "Latest News", id: "h-news", align: "center" %}
    {%- render "components/feed-news.liquid", feed: cms.posts, max: site.homepage.newsItems %}
  </div>
</section>

<section class="section section--alt" aria-labelledby="h-prods">
  <div class="section__inner">
    {%- render "components/section-head.liquid", title: "Latest Productions", id: "h-prods",
        more_url: "/productions/", more_label: "Show all productions" %}
    {%- render "components/feed-cards.liquid", feed: cms.productions, type: "productions", max: site.homepage.productionItems %}
  </div>
</section>

<section class="section" aria-labelledby="h-gfx">
  <div class="section__inner">
    {%- render "components/section-head.liquid", title: "Latest Graphics", id: "h-gfx",
        more_url: "/graphics/", more_label: "Show all graphics" %}
    {%- render "components/feed-cards.liquid", feed: cms.graphics, type: "graphics", max: site.homepage.graphicsItems %}
  </div>
</section>

<section class="section section--alt" aria-labelledby="h-music">
  <div class="section__inner">
    {%- render "components/section-head.liquid", title: "Latest Music", id: "h-music",
        more_url: "/music/", more_label: "Show all music" %}
    {%- render "components/feed-cards.liquid", feed: cms.music, type: "music", max: site.homepage.musicItems %}
  </div>
</section>

<div class="modal-wrapper">{%- render "components/modal-template.liquid" %}</div>
```

The alternation is **not** a pure nth-child pattern (hero and news are both black, then it alternates), so `--alt` is applied explicitly. Keep exactly **one** `.modal` in the DOM — `utils.js` uses a bare `document.querySelector('.modal')` and takes the first match.

**`site.js`** — add the music count:

```js
const homepage = { newsItems: 3, productionItems: 3, graphicsItems: 3, musicItems: 3 };
```

**Tests:**

```js
// tests/e2e/homepage.spec.js
import { test, expect } from "@playwright/test";

test("sections alternate black / #222 exactly as the mockup does", async ({ page }) => {
  await page.goto("/");
  const bg = (sel) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
  await expect.poll(() => bg('[aria-labelledby="h-news"]')).toBe("rgb(0, 0, 0)");
  await expect.poll(() => bg('[aria-labelledby="h-prods"]')).toBe("rgb(34, 34, 34)");
  await expect.poll(() => bg('[aria-labelledby="h-gfx"]')).toBe("rgb(0, 0, 0)");
  await expect.poll(() => bg('[aria-labelledby="h-music"]')).toBe("rgb(34, 34, 34)");
});

test("alt sections bleed to the viewport edge, content stays on the 1200px grid", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 900 });
  await page.goto("/");
  const section = await page.locator('[aria-labelledby="h-prods"]').boundingBox();
  const inner = await page.locator('[aria-labelledby="h-prods"] .section__inner').boundingBox();
  expect(section.width).toBe(1600);          // full-bleed
  expect(inner.width).toBeLessThanOrEqual(1200);
});

test("card grid reflows 3 → 2 → 1", async ({ page }) => {
  await page.goto("/");
  const cols = () => page.locator('[aria-labelledby="h-prods"] .card-grid')
    .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);
  await page.setViewportSize({ width: 1440, height: 900 }); expect(await cols()).toBe(3);
  await page.setViewportSize({ width: 800,  height: 900 }); expect(await cols()).toBe(2);
  await page.setViewportSize({ width: 500,  height: 900 }); expect(await cols()).toBe(1);
});

test("every card shows an accent-coloured date above its title", async ({ page }) => {
  await page.goto("/");
  const date = page.locator('[aria-labelledby="h-prods"] .card__date').first();
  await expect(date).toBeVisible();
  await expect(date).toHaveText(/^[A-Z]+ \d{1,2}, \d{4}$/);
  await expect(date).toHaveCSS("color", "rgb(232, 160, 60)");
});

test("card meta sits BELOW the image, not overlaid on it (regression)", async ({ page }) => {
  await page.goto("/");
  const card = page.locator('[aria-labelledby="h-prods"] .card').first();
  const img  = await card.locator(".card-image").boundingBox();
  const meta = await card.locator(".card-content").boundingBox();
  expect(meta.y).toBeGreaterThanOrEqual(img.y + img.height - 1);
  await expect(card.locator(".card-content")).toHaveCSS("position", "static");
});
```

```js
// tests/unit/filter-sort.test.js — locks the new grid selectors
it("filters the new .card-grid__item wrappers", () => {
  document.body.innerHTML = `
    <select id="TypeFilter"><option value="demo" selected></option></select>
    <select id="PlatformFilter"><option value="" selected></option></select>
    <div id="feed-wrapper"><div class="card-grid">
      <div class="card-grid__item" data-type="demo"  data-platform="amiga ocs"></div>
      <div class="card-grid__item" data-type="intro" data-platform="c64"></div>
    </div></div>`;
  handleFilterChange({ target: document.getElementById("TypeFilter") });
  const items = document.querySelectorAll(".card-grid__item");
  expect(items[0].style.display).toBe("");
  expect(items[1].style.display).toBe("none");
});

it("does not throw on a page with only one filter select (regression: B5)", () => {
  document.body.innerHTML = `
    <select id="SortSelect"><option value="handle" selected></option></select>
    <div id="feed-wrapper"><div class="card-grid"></div></div>`;
  expect(() => handleFilterChange({ target: document.getElementById("SortSelect") })).not.toThrow();
});
```

---

### Phase 5 — Hero slider  *(blocked on D1)*

No text overlay in the mockup — a pure image carousel with chevrons at the left and right edges, 16:10, on the wide (1440px) container.

Build it **progressive-enhancement first**: without JS it's a horizontally scroll-snapping strip (perfectly usable, and a `<noscript>`-free fallback). JS layers on the arrows, keyboard control and autoplay.

```liquid
{%- comment %} src/_includes/sections/hero.liquid {%- endcomment %}
{%- if slides and slides.size > 0 %}
<section class="section section--hero" aria-roledescription="carousel" aria-label="Featured">
  <div class="section__inner section__inner--wide">
    <div class="hero" data-hero{% if slides.size > 1 %} data-hero-autoplay="7000"{% endif %}>
      <div class="hero__track" role="group" aria-live="polite">
        {%- for slide in slides %}
        <figure class="hero__slide{% if forloop.first %} is-active{% endif %}"
                role="group" aria-roledescription="slide"
                aria-label="{{ forloop.index }} of {{ slides.size }}">
          <img src="{{ slide.image }}"
               srcset="{{ slide.image_sm }} 900w, {{ slide.image }} 1600w"
               sizes="(width < 900px) 100vw, 1440px"
               alt="{{ slide.title | default: '' }}"
               width="1600" height="1000"
               loading="{% if forloop.first %}eager{% else %}lazy{% endif %}"
               {% if forloop.first %}fetchpriority="high"{% endif %} decoding="async">
        </figure>
        {%- endfor %}
      </div>

      {%- if slides.size > 1 %}
      <button class="hero__nav hero__nav--prev" data-hero-prev aria-label="Previous slide">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 4l-8 8 8 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      </button>
      <button class="hero__nav hero__nav--next" data-hero-next aria-label="Next slide">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4l8 8-8 8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
      </button>
      {%- endif %}
    </div>
  </div>
</section>
{%- endif %}
```

```css
.section--hero { padding-block: var(--space-2xl) 0; }

.hero { position: relative; }

.hero__track {
  display: grid;                       /* all slides stacked in one cell */
  grid-template-areas: "slide";
  aspect-ratio: var(--ratio-hero);
  overflow: hidden;
  background: #000;
}

.hero__slide {
  grid-area: slide;
  margin: 0;
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease);
  pointer-events: none;
}
.hero__slide.is-active { opacity: 1; pointer-events: auto; }
.hero__slide img { width: 100%; height: 100%; object-fit: cover; }

.hero__nav {
  position: absolute;
  top: 50%;
  translate: 0 -50%;
  width: 44px; height: 44px;           /* 44px = minimum comfortable touch target */
  display: grid; place-items: center;
  background: none; border: 0; padding: 0;
  color: var(--color-text);
  cursor: pointer;
  opacity: 0.8;
  transition: opacity var(--dur-fast) var(--ease);
}
.hero__nav:hover { opacity: 1; }
.hero__nav svg { width: 28px; height: 28px; }
.hero__nav--prev { left: var(--space-md); }
.hero__nav--next { right: var(--space-md); }

/* No-JS fallback: a scroll-snapping strip. `.hero--enhanced` is set by JS. */
.hero:not(.hero--enhanced) .hero__track {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
}
.hero:not(.hero--enhanced) .hero__slide { opacity: 1; flex: 0 0 100%; scroll-snap-align: center; }
.hero:not(.hero--enhanced) .hero__nav { display: none; }
```

**`src/js/heroSlider.js`:**

```js
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)");

export function initHeroSliders(root = document) {
  root.querySelectorAll("[data-hero]").forEach((hero) => {
    const slides = [...hero.querySelectorAll(".hero__slide")];
    if (slides.length < 2) return;

    hero.classList.add("hero--enhanced");
    let index = slides.findIndex((s) => s.classList.contains("is-active"));
    if (index < 0) index = 0;
    let timer = null;

    const show = (next) => {
      index = (next + slides.length) % slides.length;       // wraps both ways
      slides.forEach((s, i) => s.classList.toggle("is-active", i === index));
    };

    const stop = () => { clearInterval(timer); timer = null; };
    const start = () => {
      const ms = Number(hero.dataset.heroAutoplay || 0);
      if (!ms || REDUCED.matches) return;                   // a11y: no autoplay under reduced-motion
      stop();
      timer = setInterval(() => show(index + 1), ms);
    };

    hero.querySelector("[data-hero-next]")?.addEventListener("click", () => { show(index + 1); start(); });
    hero.querySelector("[data-hero-prev]")?.addEventListener("click", () => { show(index - 1); start(); });

    hero.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") { show(index + 1); start(); }
      if (e.key === "ArrowLeft")  { show(index - 1); start(); }
    });

    // Pause while the user is looking at / interacting with it, and when the tab is hidden.
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    hero.addEventListener("focusin", stop);
    hero.addEventListener("focusout", start);
    document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));
    REDUCED.addEventListener("change", () => (REDUCED.matches ? stop() : start()));

    show(index);
    start();
  });
}
```

**Tests:**

```js
// tests/unit/heroSlider.test.js
const html = (n = 3) => `
  <div data-hero data-hero-autoplay="1000">
    <div class="hero__track">${Array.from({ length: n },
      (_, i) => `<figure class="hero__slide${i === 0 ? " is-active" : ""}"></figure>`).join("")}</div>
    <button data-hero-prev></button><button data-hero-next></button>
  </div>`;

const active = () => [...document.querySelectorAll(".hero__slide")]
  .findIndex((s) => s.classList.contains("is-active"));

it("advances and wraps forward", () => {
  document.body.innerHTML = html(3); initHeroSliders();
  const next = document.querySelector("[data-hero-next]");
  next.click(); expect(active()).toBe(1);
  next.click(); expect(active()).toBe(2);
  next.click(); expect(active()).toBe(0);   // wraps
});

it("wraps backward from the first slide", () => {
  document.body.innerHTML = html(3); initHeroSliders();
  document.querySelector("[data-hero-prev]").click();
  expect(active()).toBe(2);
});

it("exactly one slide is active at all times", () => {
  document.body.innerHTML = html(4); initHeroSliders();
  for (let i = 0; i < 6; i++) {
    document.querySelector("[data-hero-next]").click();
    expect(document.querySelectorAll(".hero__slide.is-active")).toHaveLength(1);
  }
});

it("does not autoplay under prefers-reduced-motion", () => {
  window.matchMedia = () => ({ matches: true, addEventListener() {} });
  vi.useFakeTimers();
  document.body.innerHTML = html(3); initHeroSliders();
  vi.advanceTimersByTime(5000);
  expect(active()).toBe(0);                  // never moved
});

it("leaves a single-slide hero alone (no arrows, no enhancement)", () => {
  document.body.innerHTML = html(1); initHeroSliders();
  expect(document.querySelector("[data-hero]").classList.contains("hero--enhanced")).toBe(false);
});
```

---

### Phase 6 — Inline music card player  *(scope set by D2)*

The mockup replaces the music card's image with a player widget: waveform, prev/play/next transport, and `Progression : 0:00/4:05`.

**What the existing engine gives us** (confirmed by reading `scriptprocessor_player.js` — this was the big unknown, and it's good news):

| Capability | API |
|---|---|
| Elapsed time | `ScriptNodePlayer.getInstance().getCurrentPlaytime()` → seconds |
| Position / duration | `getPlaybackPosition()` / `getMaxPlaybackPosition()` → ms |
| Seek | `seekPlaybackPosition(ms)` |
| Live spectrum/scope | An **`AnalyserNode` already exists** in the graph (`_analyzerNode`) |
| One-at-a-time | `MusicPlayerManager` is a **singleton** — starting card B automatically stops card A. This is exactly the behaviour the mockup's "Single Instance" label implies. |

So real elapsed/total time, click-to-seek and a live visualiser are all available. The only thing that *isn't* cheap is the **static full-track waveform**: tracker/SID/UADE formats are synthesised in real time, so there are no peaks to draw until the track has played. Per **D2(A)**, draw a deterministic decorative bar pattern (seeded from the title, so each card is distinct and stable across builds) and swap to the live oscilloscope on play.

`card-music.liquid` — the media slot becomes the player. **All `data-*` and the `.card-content` block stay identical to the other cards**, so the modal still works if the card body is clicked:

```liquid
<article class="card pointer" data-ctype="music" … data-playeremu='{{ card.playerEmu }}' data-asset='{{ card.asset }}'>
  <div class="card-image card-image--player">
    <div class="music-card" data-music-card
         data-asset="{{ card.asset }}" data-playeremu="{{ card.playerEmu }}" data-title="{{ card.title }}">
      <canvas class="music-card__wave" data-music-wave width="600" height="160" aria-hidden="true"></canvas>
      <div class="music-card__transport">
        <button class="music-card__btn" data-music-prev aria-label="Previous track">…</button>
        <button class="music-card__btn music-card__btn--play" data-music-play
                aria-label="Play {{ card.title }}" aria-pressed="false">…</button>
        <button class="music-card__btn" data-music-next aria-label="Next track">…</button>
      </div>
      <p class="music-card__time" data-music-time>0:00 / --:--</p>
    </div>
  </div>
  <div class="card-content">…date / title / subtitle, same as every other card…</div>
</article>
```

⚠️ The player controls sit **inside** a `.card.pointer`, whose click handler opens the modal. Every transport button handler **must** call `e.stopPropagation()` — this is the same trick `utils.js:330` already uses for the modal's play button, and forgetting it means every play click also opens the modal.

**`src/js/cardMusicPlayer.js`** (sketch — the shape, not the full file):

```js
import { musicPlayerManager } from "./musicPlayer.js";

/** Deterministic per-title bars, so a card looks the same on every build. */
function decorativePeaks(title, n = 96) {
  let h = 2166136261;
  for (const ch of title) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Array.from({ length: n }, (_, i) => {
    h = Math.imul(h ^ i, 16777619);
    return 0.25 + (((h >>> 8) & 0xff) / 255) * 0.75;
  });
}

export function initMusicCards(root = document) {
  const cards = [...root.querySelectorAll("[data-music-card]")];

  cards.forEach((card, i) => {
    const play = card.querySelector("[data-music-play]");
    const wave = card.querySelector("[data-music-wave]");
    const time = card.querySelector("[data-music-time]");
    const peaks = decorativePeaks(card.dataset.title);
    let raf = null;

    drawBars(wave, peaks, 0);            // idle state

    play.addEventListener("click", (e) => {
      e.stopPropagation();               // ← or the card's modal handler fires too
      if (musicPlayerManager.getCurrentTrack() === card.dataset.asset) {
        musicPlayerManager.togglePlayback();
      } else {
        cards.forEach(resetCard);        // singleton: only one card can be live
        musicPlayerManager.loadAndPlay(card.dataset.asset, card.dataset.title, card.dataset.playeremu);
      }
    });

    // Click-to-seek on the waveform
    wave.addEventListener("click", (e) => {
      e.stopPropagation();
      const engine = window.ScriptNodePlayer?.getInstance?.();
      if (!engine) return;
      const max = engine.getMaxPlaybackPosition();
      if (max > 0) engine.seekPlaybackPosition(max * (e.offsetX / wave.clientWidth));
    });

    card.querySelector("[data-music-next]").addEventListener("click", (e) => {
      e.stopPropagation();
      cards[(i + 1) % cards.length].querySelector("[data-music-play]").click();
    });
    card.querySelector("[data-music-prev]").addEventListener("click", (e) => {
      e.stopPropagation();
      cards[(i - 1 + cards.length) % cards.length].querySelector("[data-music-play]").click();
    });

    // rAF loop while playing: live scope from the existing AnalyserNode + time readout
    const tick = () => { /* drawScope(wave, analyser); time.textContent = fmt(...); raf = requestAnimationFrame(tick); */ };
  });
}
```

**Tests:**

```js
// tests/unit/cardMusicPlayer.test.js
it("stops the previously playing card when another starts (singleton)", () => {
  // two cards; click play on A, then on B → loadAndPlay called with B's asset, A reset to idle
});

it("does not open the modal when a transport button is clicked (stopPropagation)", () => {
  const onCardClick = vi.fn();
  document.querySelector(".card.pointer").addEventListener("click", onCardClick);
  document.querySelector("[data-music-play]").click();
  expect(onCardClick).not.toHaveBeenCalled();   // ← the bug this guards against
});

it("draws the same decorative waveform for the same title across builds", () => {
  expect(decorativePeaks("Samsara")).toEqual(decorativePeaks("Samsara"));
  expect(decorativePeaks("Samsara")).not.toEqual(decorativePeaks("60Y by TRSI"));
});

it("formats the time readout as the mockup does", () => {
  expect(fmt(0, 245)).toBe("0:00 / 4:05");
});
```

---

### Phase 7 — Inner pages

Mostly mechanical once the section/card system exists.

| Page | Change |
|---|---|
| `news.liquid` | Switch from the 1/5-image list to the 3-up card grid. Retire the `list` variant of `feed-news.liquid`. |
| `news-post.liquid` | **Fix B1** (`post.date` → `post.publishDate \| displayDate`). Restyle the article body; "Other Posts" becomes a card grid. |
| `productions.liquid`, `graphics.liquid`, `music.liquid` | Wrap in `.section > .section__inner`; page title uses `--fs-page-title`; restyle the filter bar. Markup otherwise unchanged. |
| `members.liquid` | Same. Member cards keep their bottom-gradient overlay (they're portraits — the overlay reads well) or move to the standard below-image meta. **Your call.** |
| `about.liquid` | Wrap in the new section shell; replace the inline social block with `social-links.liquid`. |
| `404.html` | Reskin. |

Filter bar restyle (`filters.css`) — drop the Bulma `.select` chrome for a flat dark control:

```css
.filter-wrapper { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-sm) var(--space-md); margin-bottom: var(--space-xl); }
.filter-wrapper select {
  appearance: none;
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: 0.4rem 2rem 0.4rem 0.9rem;
  font: inherit;
  font-size: var(--fs-meta);
}
.filter-wrapper select:hover { border-color: var(--color-accent); }
```

`#TypeFilter` / `#PlatformFilter` / `#SortSelect` ids are unchanged — no JS impact.

---

### Phase 8 — Build, PurgeCSS, performance

**PurgeCSS will delete our design tokens.** `postcss.config.mjs` runs with `variables: true`, which strips custom properties it believes are unused — including any token only ever read from JS (`--color-wave` via `getComputedStyle`), and any class applied dynamically.

```js
safelist: {
  standard: [
    // existing Bulma dynamics
    "is-active", "is-hidden", "has-text-centered", "modal", "modal-background", "modal-content", "modal-close", "box", "button",
    // new design system — applied by JS, so PurgeCSS can't see them
    "hero--enhanced", "is-current", "card-grid__item", "section--alt",
  ],
  greedy: [/^hero__/, /^music-card/, /^card__/, /^site-nav/, /^social-links/],
  variables: [/^--color-/, /^--font-/, /^--fs-/, /^--fw-/, /^--ls-/, /^--lh-/,
              /^--space-/, /^--container/, /^--gutter/, /^--grid-gap/, /^--section-pad/,
              /^--ratio-/, /^--dur/, /^--ease/],
},
```

Also add `./src/**/*.liquid` is already covered, but the new `src/_includes/components/*.liquid` files are too — confirm the glob catches them (it does: `./src/**/*.liquid`).

**Performance budget** (enforced in `tests/integration/build-check.js`):

| Metric | Budget |
|---|---|
| `dist/css/main.min.css` | ≤ 60 KB uncompressed |
| Hero LCP image | ≤ 250 KB (WebP q82 @1600w) |
| Homepage total JS | ≤ 40 KB (excluding the lazily-loaded wasm players) |
| CLS | 0 — guaranteed by `aspect-ratio` on every media container |

The wasm players (`uade.wasm`, `websid.wasm`, `mpt.wasm`) are only fetched on demand — keep it that way. `main.js:26` currently preloads them when `pathname.startsWith('/music')`; **with the new homepage Latest Music section, extend that to the homepage too**, or the first play has a multi-second stall:

```js
if (location.pathname === "/" || location.pathname.startsWith("/music")) preloadMusicLibraries();
```

---

### Phase 9 — Accessibility & QA

| Check | How |
|---|---|
| Contrast | All pairs in §2.1 verified ≥ AA. Automated in the axe run. |
| Keyboard | Cards get `tabindex="0" role="button"` + Enter/Space. Hero arrows are real `<button>`s. Skip link added. |
| Focus | Visible `:focus-visible` ring in `--color-accent` (never `outline: none`). |
| Reduced motion | Hero autoplay off; all transitions → 0ms via the `:root` media query. |
| Carousel semantics | `aria-roledescription="carousel"`, per-slide `aria-roledescription="slide"`, `aria-live="polite"` on the track. |
| Nav | `aria-current="page"`, `aria-expanded` synced on the burger. |
| Images | Decorative images inside links get `alt=""`; content images get real alt text. |
| Landmarks | `<header>`, `<main id="main">`, `<footer>`, `<nav aria-label>`. |

```js
// tests/e2e/a11y.spec.js
import AxeBuilder from "@axe-core/playwright";

for (const path of ["/", "/news/", "/productions/", "/graphics/", "/music/", "/members/", "/about/"]) {
  test(`${path} has no serious or critical a11y violations`, async ({ page }) => {
    await page.goto(path);
    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = violations.filter((v) => ["serious", "critical"].includes(v.impact));
    expect(bad, JSON.stringify(bad.map((v) => v.id))).toEqual([]);
  });
}
```

---

## 8. Test plan summary

| Layer | Tool | Covers |
|---|---|---|
| **Unit** | Vitest + jsdom | `displayDate`/`isoDate` (incl. the TZ off-by-one); hero slider state machine; filter/sort against the new grid selectors; `getDataFromCard` DOM contract; card music player singleton + `stopPropagation`; modal button independence (B3) |
| **E2E** | Playwright ×3 viewports | Section alternation + full-bleed; container widths; grid reflow 3/2/1; nav (6 items, `aria-current`, burger); hero (advance/wrap/keyboard/reduced-motion); card→modal (YouTube src set, Escape clears iframe); filters; members sort; music play/pause |
| **Visual** | Playwright screenshots | Full-page homepage at 1440/768/390; each section in isolation. Baselines committed; `test:e2e:update` to re-baseline. |
| **A11y** | axe-core | 0 serious/critical on all 7 routes |
| **Integration** | Node script | Build succeeds; `dist/img/hero/` populated; every `<img src>` in `dist/**/*.html` resolves on disk; no unencoded spaces in `src=""` (B9); CSS ≤ 60 KB |

**Fixtures are the gating dependency.** `cms/data/*.json` is gitignored and the build hits Contentful, so CI cannot build today. Phase 0 adds `tests/fixtures/cms/*.json` and the fallback in `cms.js`. Do not skip this — every later test depends on it.

---

## 9. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| **No wide hero imagery exists** (D1) | **Certain** | Blocking decision. Option C ships without any Contentful change but looks different from the mockup. |
| Filter/sort silently break when `.column` → `.card-grid__item` | High | The exact JS diff is in Phase 4c, and `tests/unit/filter-sort.test.js` fails loudly if it's missed. |
| Modal action buttons matched by `innerText` | Medium | Documented in §5. **Do not rename button labels.** |
| PurgeCSS eats the new tokens (`variables: true`) | Medium | Explicit `variables` safelist in Phase 8; the integration test asserts the CSS still contains `--color-accent`. |
| Music transport clicks bubble into the card's modal handler | Medium | `stopPropagation()` on every transport button + a unit test that asserts it. |
| Accent orange is a reconstruction, not a sample | Medium | Confirm against the logo files; one-token change. |
| Bulma specificity fights the new CSS | Low | New components use zero Bulma classes; Bulma is scoped to the modal (D4). |
| Legacy themes break | Certain, accepted | D5 — they're retired; rollback is the branch. |

**Rollback:** the whole redesign lives on `feature/redesign-2026`. `main` is untouched until merge. There's no half-way state to maintain.

---

## 10. Sequencing

| Phase | Depends on | Est. |
|---|---|---|
| 0 — Test infra + fixtures | — | 0.5 d |
| 1 — Data layer (dates, hero derivative, B1/B2/B7) | 0 | 1 d |
| 2 — Tokens, fonts, base CSS | 0 | 0.5 d |
| 3 — Shell: base/header/footer | 2, **your logos** | 1 d |
| 4 — Sections + cards + homepage | 1, 2, 3 | 1.5 d |
| 5 — Hero slider | 4, **D1** | 1 d |
| 6 — Inline music player | 4, **D2** | 2 d |
| 7 — Inner pages | 4 | 1 d |
| 8 — Build/PurgeCSS/perf | 4–7 | 0.5 d |
| 9 — A11y + QA sweep | all | 1 d |

Phases 0–4 alone get you the mockup's static layout end-to-end. Phases 5 and 6 are the two genuinely new components and can land independently after that.

---

## Appendix A — Raw measurements

Sampled from `signal-2026-07-14-18-09-26-207.jpg` (1170 × 3072) with Sharp.

**Section bands (left-edge column scan, x=8):**

```
y    0 – 1262   #000000    hero + latest news
y 1264 – 1782   #222222    latest productions   (height 519)
y 1784 – 2302   #000000    latest graphics      (height 519)
y 2304 – 2818   #222222    latest music         (height 515)
y 2820 – 3072   #000000    footer
```

**Horizontal extents:**

```
content container   x 146 – 1023   (w 878)   → 75.0% of frame
hero                x  61 – 1107   (w 1047)  → 89.5% of frame
card grid           3 × 277, gap 24          → 3×277 + 2×24 = 879 ✓
header: logo        x 146 – 236              → flush with container left
header: nav         x 386 –  788             → centred (mid 587 vs container mid 584.5)
header: social      x 933 – 1023             → flush with container right
```

**Vertical rhythm (productions section):**

```
section top        1264
heading ink        1352 – 1375     → 88px top padding
card image         1406 – 1623     → 30px heading→grid gap; 277×218 = 1.271 (5:4)
date               1640 – 1648     → 17px image→date gap
title              1656 – 1672
subtitle           1680 – 1695
section bottom     1782            → 87px bottom padding
```

**Colour samples** (brightest / most-saturated pixel per region):

```
nav active            #ffffff
nav inactive          #a7a7a7
section heading       #ffffff
card title            #ffffff
teaser / subtitle     #b3b3b3
footer tagline        #9e9e9e
card date             hue 37–39°, avg-of-top-25 #a38348 → reconstructed #e8a03c
header logo           #ff7b00  (most saturated)
footer logo           #fb7c07
music widget bg       #19161d
music waveform        #ba3f38 → reconstructed #c93b2f
```

## Appendix B — Assets needed from you

1. `logo-header.svg` — the chrome TRSI mark, ~120 × 48 as used in the header.
2. `logo-footer.svg` — the larger chrome TRSI mark, ~280 × 70.
   SVG strongly preferred (the chrome gradient will scale cleanly and stay crisp on retina). If only raster exists, supply @2x WebP/PNG.
3. Confirmation of the accent orange (§2.1) — or just the logo source, and I'll resample it.
4. If **D1 = option A or B**: wide (≥1600 px, 16:10) hero images uploaded to Contentful.

---

## 11. What changed during implementation

Recorded against the plan above, so the two don't drift.

### Corrections to the measurements

- **Hero is 16:9, not 16:10.** The first measurement was contaminated by the mockup's own nav text. See §2.3.
- **The hero placeholder image had the mockup's nav bar baked into it** for the same reason, and rendered as a phantom second header. Re-cropped from y=121.

### Decisions as built

- **D1 — fixed hero.** `src/_data/hero.js` returns a single hard-coded slide
  (`/img/hero-placeholder.webp`, cropped from the mockup). The slider handles any
  number of slides, and arrows only appear from two upwards, so pointing `hero.js`
  at a CMS source later is a one-file change. **A `hero` (1600w) and `hero-sm`
  (900w) derivative are already generated** for every asset by `copyImageAssets.js`.
- **D2 — inline player, progress-filled waveform.** The engine turned out to expose
  `getPlaybackPosition()` / `getMaxPlaybackPosition()` / `seekPlaybackPosition()`,
  so elapsed time, total time and click-to-seek are real. The waveform bars are
  deterministic per title (there is no decoded PCM buffer to derive true peaks
  from until a tracker file has played through) and fill with `--color-wave` as
  the track progresses. The live-oscilloscope idea was dropped: the `AnalyserNode`
  exists in the graph but nothing guarantees it is connected, and progress-fill is
  what the mockup actually shows.
- **D3 — About moved to the footer.** Nav is Home · News · Members · Productions ·
  Graphics · Music, and Music is no longer gated.
- **D4 — Bulma kept**, scoped to the modal. No new component depends on it.
- **D5 — legacy themes deleted.** `styles.css`, `theme-joe.css` and `theme-first.css`
  are gone; `site.theme` is removed. All tokens live in `src/css/tokens.css` inside
  the main bundle, so there is no second, unpurged stylesheet. Rollback is the branch.

### Deviations from the planned markup

- **The card title is the button, not the card.** The plan put
  `role="button" tabindex="0"` on the whole `<article>`. That is invalid for music
  cards, which contain transport buttons — axe flags it as `nested-interactive`
  (serious). The title is now a real `<button class="title card__open">`; clicking
  anywhere on the card still opens the modal (mouse convenience), and the keyboard
  path goes through the button, whose click bubbles up to the same handler. No
  `keydown` handler is needed.
- **`html` needs the page background, not just `body`.** Bulma paints `<html>` white
  via `--bulma-scheme-main`, which the deleted `styles.css` used to override. WebKit
  additionally propagates `body`'s background to the canvas and reports `body` itself
  as transparent, so axe computed every card's contrast against white. Fixed by
  setting `html { background-color: var(--color-bg) }` and bridging the handful of
  `--bulma-*` scheme variables in `tokens.css`.

### Bugs fixed (§4)

B1, B2, B3, B4, B5, B6, B7, B9 are all fixed. B8 is resolved: the previously-dead
480px `post` derivative is now the small end of the news card `srcset`. B10 is moot —
`aspect-ratio` on the media container removes the CLS regardless of the intrinsic
attributes. `cms/scripts/copyContent.js` was deleted (orphaned; referenced a
directory that does not exist).

`copyImageAssets.js` was also made genuinely async — it previously fired Sharp
promises without awaiting them, so `processContent.js` could exit mid-write.

### Verification

| Gate | Result |
|---|---|
| `npm run typecheck` | 0 errors (new: `tsc --noEmit` with `checkJs`, plus `types/globals.d.ts` for the wasm engine) |
| `npm test` | 38 unit tests, all passing |
| `npm run test:e2e` | 64 tests across Chromium (desktop) and WebKit (mobile), all passing |
| `npm run test:integration` | all checks passing — hero derivatives present, every image URL resolves on disk, no unencoded spaces, tokens survive PurgeCSS |
| CSS bundle | 51.1 KB (budget 60 KB) |
| axe-core | 0 serious/critical violations on all 7 routes, both viewports |

### Still outstanding

1. **Real logos.** `trsi-logo-header.webp` (97×64) and `trsi-logo-footer.webp` (245×46)
   are crops from the mockup and are soft at their rendered size. Replace with the SVGs.
2. **`--color-accent` is a reconstruction** at the measured hue (37–39°). Resample it
   from the real logo artwork.
3. **Hero content** (D1) — the fixed slide is a placeholder.
