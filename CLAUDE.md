# CLAUDE.md

## First Steps

Before working on this codebase, read the detailed research document at `.claude/research.md` for a comprehensive understanding of the project architecture, build pipeline, content types, data flow, and key patterns.

## Quick Reference

- **Stack**: Eleventy 3.0 + Contentful CMS + Bulma CSS + Liquid templates
- **Input**: `src/` — **Output**: `dist/`
- **CMS data**: `cms/data/*.json` (generated, gitignored) — loaded via `src/_data/cms.js`
- **Config**: `.eleventy.js` (11ty), `postcss.config.mjs` (CSS pipeline), `cms/config.json` (Contentful)
- **Env vars**: `DELIVERY_TOKEN`, `MANAGEMENT_TOKEN`, `NODE_ENV` in `.env`

## Commands

- `npm start` — Full build + dev server with watch
- `npm run serve` — Eleventy serve only (skip content fetch)
- `npm run build` — Production build (content + CSS + 11ty)
- `npm run build:content` — Fetch + process Contentful data
- `npm run build:css` — PostCSS pipeline → `dist/css/main.min.css`

## Content Types

Five content types from Contentful: **productions**, **graphics**, **music**, **members**, **posts**. Each has a transform script in `cms/scripts/transform*.js` and a card template in `src/_includes/components/card-*.liquid`.

## Key Patterns

- Cards embed all data in `data-*` attributes; modals populate client-side from these attributes (no API calls)
- Music playback uses libopenmpt/ChiptuneJS for tracker formats (MOD/XM/IT/S3M) via singleton `MusicPlayerManager`
- Two themes available (`theme-joe.css` dark, `theme-first.css` light), controlled by `site.theme` in `src/_data/site.js`
- Music nav item is hidden by default, revealed via `?mode=wotw` URL parameter
- Images processed to 3 WebP sizes (orig, card/400px, post/150px) via Sharp
- Social links live only in `src/_data/social.json`; each entry's `locations` array (`header`, `footer`, `about`, `schema`) picks the surfaces it renders on, and `icon` names an SVG in `src/icons/` (required for `header`, optional elsewhere)

## Commit Messages

Harmonized standard — keep every commit message brief.

- **Square-bracketed type prefix**: the title opens with a short Conventional-Commits type in square brackets — `[feat]`, `[fix]`, or `[chore]` (refactors, cleanup, deps, docs, config — anything non-behavioral). Use another standard short type (`[docs]`, `[test]`, `[perf]`, `[ci]`, `[refactor]`) when it's clearer. Square brackets, not round — parentheses are reserved for scope in Conventional Commits.
- **Short imperative title**: `[type] Do the thing`, ≤ ~60 chars. e.g. `[fix] Clamp peer avatar size`, `[chore] Unify app config into config.json`.
- **Brief body**: include a short body — one blank line after the title, then a single wrapped (at 70 +- 5 letters) paragraph covering just the necessary context. Keep it short; don't over-detail or write a play-by-play narrative.
- **No AI mentions** (see Core Principles).
