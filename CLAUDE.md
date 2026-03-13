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
