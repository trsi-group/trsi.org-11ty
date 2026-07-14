# CLAUDE.md

## First Steps

Read `.claude/research.md` for the project architecture, and `plans/2026-redesign.md`
for the current design system, its measurements, and the DOM contracts between the
templates and the client JS.

## Quick Reference

- **Stack**: Eleventy 3.0 + Contentful CMS + Bulma (modal only) + Liquid templates
- **Input**: `src/` — **Output**: `dist/`
- **CMS data**: `cms/data/*.json` (generated, gitignored) — loaded via `src/_data/cms.js`,
  which falls back to `tests/fixtures/cms/` when absent so CI can build without Contentful
- **Config**: `.eleventy.js` (11ty), `postcss.config.mjs` (CSS pipeline), `cms/config.json` (Contentful)
- **Env vars**: `DELIVERY_TOKEN`, `MANAGEMENT_TOKEN`, `NODE_ENV` in `.env`

## Commands

- `npm start` — Full build + dev server with watch
- `npm run serve` — Eleventy serve only (skip content fetch)
- `npm run build` — Production build (content + CSS + 11ty)
- `npm run build:content` — Fetch + process Contentful data
- `npm run build:css` — PostCSS pipeline → `dist/css/main.min.css`
- `npm run typecheck` — `tsc --noEmit` with `checkJs` over the authored JS
- `npm test` — Vitest unit tests
- `npm run test:e2e` — Playwright, desktop + mobile
- `npm run test:integration` — Asserts the built `dist/` (assets resolve, tokens survive purge)

## Content Types

Five content types from Contentful: **productions**, **graphics**, **music**, **members**, **posts**.
Each has a transform script in `cms/scripts/transform*.js` and a card template in
`src/_includes/components/card-*.liquid`.

## CSS

Tokens in `src/css/tokens.css`, layout primitives in `layout.css`, one file per component
under `src/css/components/`. All values are measured from the design mockup — see
`plans/2026-redesign.md` §2 before changing a token.

PurgeCSS runs with `variables: true` and **will delete design tokens and JS-applied classes
unless they are safelisted** in `postcss.config.mjs`.

Bulma is retained only for the modal. Do not build new components on it. It still ships
light-scheme defaults, so the `--bulma-*` bridge variables in `tokens.css` must stay.

## Key Patterns

- Cards embed all data in `data-*` attributes; the modal populates client-side from them (no API calls).
  `data-release_date` (underscore) and `data-playeremu` (lowercase) have load-bearing
  non-standard casing — do not "tidy" them.
- Modal action buttons are matched by their **lowercased visible text**. Renaming a label
  silently disables that button.
- The card **title** is the button that opens the modal, not the card. Making the card a
  `role="button"` nests the music card's transport controls inside a button (invalid).
- Filter and sort operate on `#feed-wrapper .card-grid__item`, which must stay a direct
  child of `.card-grid`.
- Music playback goes through the singleton `MusicPlayerManager` (MPT / SID / UADE wasm
  backends), so only one track can play at a time. Card players and the modal player both
  register callbacks on it lazily, so the most recent interaction owns the UI.
- Images are processed by Sharp into five WebP derivatives: `orig`, `hero` (1600w),
  `hero-sm` (900w), `card` (800w), `post` (480w). Filenames are URL-encoded, because
  Contentful filenames contain spaces.
- Dates from the CMS are ISO `YYYY-MM-DD`. Format them with the `displayDate` / `isoDate`
  filters, **not** Liquid's `date` filter, which parses them as UTC midnight and drifts a
  day backwards in UTC-negative timezones.
