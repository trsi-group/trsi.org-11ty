# Solution Architecture

Static site for the demogroup TRSI. **Eleventy 3 + Liquid**, content from
**Contentful**, images via **Sharp**, CSS through **PostCSS/PurgeCSS**, deployed
to **Netlify** from `main`. No client framework, no bundler — `src/js` is copied
verbatim and loaded as ES modules.

## Build pipeline

```
Contentful ──build:c-fetch──▶ cms/export/       (contentful CLI `space export`, gitignored)
           ──build:c-process─▶ cms/data/*.json  (transforms, gitignored)
                             ▶ dist/img/{orig,card,post,social}/  (Sharp)
                             ▶ dist/tracks/     (module files)
           ──build:c-verify──▶ fails if a legacy URL stopped being generated
build:banners  src/assets/banner/ ──▶ src/public/img/banner/*-{768,1280,1920}.webp
build:css      src/css/index.css  ──▶ dist/css/main.min.css
eleventy       src/ + cms/data/   ──▶ dist/
```

`npm run build` runs all of it; `npm run serve` is Eleventy alone against existing
`cms/data`.

## Layout

| Path | Role |
|---|---|
| `cms/scripts/transform*.js` | Contentful export → one JSON per content type. **All data shaping lives here**, never in `cms.js` or templates. |
| `cms/scripts/assetPaths.js` | Asset id → local filename. Names carry 8 chars of the asset id because Contentful filenames collide and the CDN is case-insensitive. |
| `cms/scripts/slug.js` | The two slug algorithms. See *Contracts*. |
| `src/_data/cms.js` | Loads `cms/data/*.json` into the global `cms`. Load only. |
| `src/_data/legacySlugs.json` | Checked-in snapshot of every URL shared before detail pages existed. |
| `src/_includes/layouts/base.liquid` | The only layout. Head, meta, JSON-LD, header/footer. |
| `src/_includes/components/media-card.liquid` | One card template for all five types, switched on `kind`. |
| `src/_includes/components/item-detail.liquid` | One detail body for productions/graphics/music. |
| `src/js/` | Hand-written ES modules + vendored player backends. Nothing from `node_modules` reaches the browser. |

## Pages

| Template | Output |
|---|---|
| `productions.liquid` / `graphics.liquid` / `music.liquid` / `members.liquid` / `news.liquid` | index grids |
| `production.liquid` / `graphic.liquid` / `music-track.liquid` | `/<type>/<slug>/` — `pagination size:1`, `alias: item` |
| `news-post.liquid` | `/news/<slug>/` |

Detail templates set `item_kind`, which drives `og:type`, the JSON-LD type
(`VideoObject` / `VisualArtwork` / `MusicRecording`) and the nav highlight.
`title` is the single source for `<title>` **and** `og:title`.

## Contracts — break these and URLs or ordering break silently

- **Slugs are a compatibility contract.** Productions/graphics/music use
  `itemSlug` (`@sindresorhus/slugify`, `decamelize:false` — matches Eleventy's
  `slugify` filter, which minted the URLs already in the wild). Posts use
  `postSlug`, which predates it and transliterates differently. **Not
  interchangeable.** `build:c-verify` fails the build if any of the 199 recorded
  URLs stops being generated.
- **A missing `release_date` must be `''`, never `null`.** liquidjs `sort`
  compares inconsistently against null and scrambles the *whole* feed, not just
  the undated entry.
- **Fragments never reach the server.** Items were once modal fragments
  (`/productions/#slug`); `sections/hash-redirect.liquid` forwards them
  client-side before paint. No redirect rule can do this.
- **Image variants**: `orig` (WebP, unresized), `card` (800w), `post` (480w),
  `social` (1200×630 JPEG, letterboxed on `#0a0a0a`, nearest-neighbour under
  800px so pixel art stays crisp). `social` is what `og:image` points at.

### Renaming an entry

Titles derive slugs, so renaming in Contentful retires a URL. Because items are
real paths rather than fragments, the old one can be redirected:

1. Rename in Contentful, `npm run build:content`
2. `build:c-verify` fails and names the URL that broke
3. Add `"<old-slug>": "<new-slug>"` under the type in
   `src/_data/slugAliases.json`

`src/_redirects.liquid` turns that into a Netlify 301, and chains are flattened
so an older alias pointing at the slug you just retired keeps working. The guard
also rejects an alias pointing at nothing, and one pointing away from a slug
that is live again — which would redirect visitors off a real page.

Contentful keeps a snapshot of every publish, so past titles are recoverable via
the CMA: `GET /spaces/{space}/environments/master/entries/{id}/snapshots`. That
is how the existing aliases were seeded.

## Client JS

`main.js` wires everything on `DOMContentLoaded`: nav, hero rotation, grid
filters, sort, and — on `/music*` only — the audio session, WASM progress and
player preload.

Audio is the subtle part:

- `audioContext.js` owns `window._gPlayerAudioCtx`, which the vendored
  `ScriptNodePlayer` adopts because it only builds one when that is undefined.
- **`unlockAudioContext()` must be called synchronously inside the tap.** iOS
  only unlocks a context from a real gesture; anything awaited first loses it.
- `navigator.audioSession.type = 'playback'` stops the iPhone ringer switch
  muting Web Audio (this rule does not apply to `<audio>` elements).
- `play()` waits for the context to actually reach `running` and throws
  `AudioBlockedError` otherwise — never report playing without checking.
- Player `initialize()` returns one memoised promise: the preload and a tap race
  on every visit, and two concurrent initialisations used to strand the second.
- Backends are ~2.3 MB of WASM; `wasmProgress.js` wraps `fetch` to drive the
  ring on the play button.

## Gotchas

- `src/_data/banners.js` shuffles the hero randomly, so `dist/index.html`
  differs on every build. Exclude it when diffing build output.
- PurgeCSS only keeps classes it can see as literals; JS-toggled ones are in the
  `safelist` in `postcss.config.mjs`.
- `dist/` is never cleaned, so local builds accumulate stale files. Netlify
  builds from a clean checkout, so they are not deployed.
- `cms/scripts/copyContent.js` is referenced by nothing — dead.
- The music nav item is hidden by CSS (`nav__item--hidden`); the pages are
  public and in the sitemap.
