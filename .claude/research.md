# TRSI.org 11ty — Codebase Research

## Overview

TRSI.org is a static website for **Tristar & Red Sector Inc. (TRSI)**, a legendary demoscene group founded in 1990. The site is built with **Eleventy 3.0+**, uses **Contentful** as a headless CMS, and is styled with **Bulma 1.0.3**. Templates use Liquid. The tagline is "The Sleeping Gods".

---

## Project Structure

```
.eleventy.js              # Eleventy config (input: src/, output: dist/)
postcss.config.mjs        # PostCSS pipeline (import → autoprefixer → purgecss → cssnano)
package.json              # Dependencies & build scripts
cms/                      # Contentful CMS integration layer
  config.json             # Contentful space/env config (space: l8kv2ckiiqjb)
  scripts/
    fetchContent.js       # Downloads content export from Contentful API
    processContent.js     # Orchestrates all transform scripts
    transformProductions.js
    transformMembers.js
    transformGraphics.js
    transformMusic.js
    transformPosts.js
    copyImageAssets.js    # Sharp-based image optimization (→ WebP, 3 sizes)
    copyTrackAssets.js    # Copies music track files
  export/                 # (gitignored) Raw Contentful export
  data/                   # (gitignored) Processed JSON files
src/
  _data/
    cms.js                # Loads all processed CMS JSON into global `cms` object
    site.js               # Site metadata, theme, domain, env detection
    nav.js                # Navigation data loader
    navdata.json          # Nav items array (Music is hidden by default)
    social.json           # Social media links (FB, YouTube, X, Instagram)
  _includes/
    layouts/
      base.liquid         # Main HTML wrapper (conditional CSS, meta, favicons)
    components/
      feed-cards.liquid   # Generic card grid (configurable: feed, type, max, sort)
      card-productions.liquid
      card-graphics.liquid
      card-music.liquid
      card-members.liquid
      feed-news.liquid    # News post list with thumbnails
      feed-filter.liquid  # Dynamic Type/Platform filter dropdowns
      modal-template.liquid  # Reusable modal overlay (video/image/music player)
    sections/
      header.liquid       # Navbar with burger menu + social icons
      footer.liquid       # Footer with social links
      og-tags.liquid      # Open Graph meta tags
      jsonld-post.liquid  # BlogPosting structured data
      jsonld-organisation.liquid  # Organization structured data
  css/
    index.css             # Entry point (@imports all CSS)
    bulma.css             # Bulma framework (~21k lines)
    fonts.css             # @font-face declarations
    styles.css            # Custom styles (~368 lines, CSS variables, cards, modals)
    theme-joe.css         # Dark theme with glow effects (active by default)
    theme-first.css       # Light/alternate theme
  js/
    main.js               # Entry point: event listeners, feature flags, init
    utils.js              # Modal logic, filtering, music player UI (~356 lines)
    musicPlayer.js        # Music playback abstraction (~469 lines)
    chiptune2.js          # ChiptuneJS library
    libopenmpt.js         # Emscripten-compiled OpenMPT for tracker playback
    libopenmpt.js.mem     # Memory file for libopenmpt
  fonts/                  # Web fonts (Edit Undo Brk, Edit Undo Line, Passero One, Roboto)
  public/                 # Static assets copied to dist root
    img/                  # Favicons, logos
    robots.txt
  icons/                  # SVG icons (play, pause, social media)
  index.liquid            # Home page
  productions.liquid      # Productions gallery with filtering
  music.liquid            # Music catalog (hidden nav, feature-flagged)
  graphics.liquid         # Graphics portfolio
  members.liquid          # Member directory
  about.liquid            # About page (static content)
  news.liquid             # News feed
  news-post.liquid        # Individual post pages (paginated from cms.posts)
  sitemap.xml.liquid      # XML sitemap
  404.html                # Error page
```

---

## Build Pipeline

### Scripts (package.json)

| Command | What it does |
|---------|-------------|
| `npm run build:c-fetch` | Downloads content from Contentful API |
| `npm run build:c-process` | Transforms raw export into JSON + optimizes images |
| `npm run build:content` | fetch + process combined |
| `npm run build:css` | PostCSS pipeline → `dist/css/main.min.css` |
| `npm run build` | Full build: content + css + eleventy |
| `npm start` | Full build + eleventy dev server with watch |
| `npm run serve` | Eleventy serve only (no content rebuild) |
| `npm run debug` | Build with Eleventy debug logging |

### Content Pipeline

```
Contentful API (DELIVERY_TOKEN + MANAGEMENT_TOKEN)
  → contentful-cli space export
  → cms/export/content.json + downloaded assets
  → transform scripts (one per content type)
  → cms/data/{productions,members,graphics,music,posts}.json
  → Sharp image optimization (orig/card/post WebP variants)
  → Track file copying
```

### CSS Pipeline

```
src/css/index.css
  → postcss-import (resolves @imports)
  → autoprefixer
  → purgecss (scans .liquid/.html/.md/.js for used classes)
  → cssnano (minification)
  → dist/css/main.min.css
```

PurgeCSS safelist includes Bulma dynamic classes: `is-active`, `has-text-centered`, `is-hidden`, `is-hidden-mobile`, `is-hidden-tablet`, modal classes, column classes.

### Eleventy Config (.eleventy.js)

- Input: `src/`, Output: `dist/`
- Pass-through copies: `js/`, `fonts/`, `css/`, `public/` → root, `cms/data/` → `dist/data/`
- Watch targets: `*.png`, `*.jpeg`, `*.webp`, `*.js`
- Plugin: `@jgarber/eleventy-plugin-markdown`

---

## Content Types & Data Schemas

### Productions
Fields: `title`, `type`, `platform`, `release_date`, `description`, `nfo_text`, `card_image`, `youtube` (nocookie embed URL), `pouet`, `demozoo`, `csdb`, `credits[]` (name + contribution)

### Graphics
Fields: `title`, `type`, `platform`, `release_date`, `description`, `nfo_text`, `card_image`, `asset` (full-res path), `download`, `demozoo`, `credits[]`

### Music
Fields: `title`, `type` (MOD/XM/IT/S3M), `platform`, `release_date`, `description`, `nfo_text`, `card_image`, `asset` (track path), `playerEmu`, `download`, `demozoo`, `kestra`, `credits[]`, `tags[]`

### Members
Fields: `handle`, `real_name`, `card_image`, `member_since`, `member_status` (Active/Retired)

### Posts
Fields: `title`, `slug` (auto-generated), `teaser`, `body` (markdown), `post_image`, `publishDate`

---

## Data Flow: CMS → Templates

1. `cms.js` reads JSON files from `cms/data/` directory
2. Returns object: `{ productions, members, graphics, music, posts }`
3. Available in templates as `cms.productions`, `cms.music`, etc.

**Important:** All data shaping (e.g. adding derived fields like `sort_handle`) belongs in `cms/scripts/transform*.js`, not in `cms.js` or templates. `cms.js` only loads and exposes the pre-transformed JSON.
4. Page templates pass data to `feed-cards` component with config (type, max, sort)
5. `feed-cards` iterates and includes per-type card templates
6. Cards embed all data in `data-*` attributes for client-side modal population

---

## Client-Side Architecture

### main.js — Event System
- **Navbar toggle**: Hamburger menu for mobile
- **Filter system**: Type/Platform dropdowns trigger `handleFilterChange()`
- **Modal system**: Card button clicks → `getDataFromCard()` → `populateModal()` → open
- **URL hash**: Opens modal matching `#slug` on page load
- **Keyboard**: Escape closes modals
- **Feature flag**: `?mode=wotw` URL param reveals hidden Music nav item
- **Music preload**: Background initialization of libopenmpt library

### utils.js — Modal & Filter Logic
- `openModal()` / `closeModal()`: Bulma modal control, preserves scroll position
- `getDataFromCard($card)`: Extracts 20+ data attributes from card DOM
- `populateModal(data)`: Injects content into modal template based on content type
  - Productions → YouTube iframe
  - Graphics → full image
  - Music → image + play overlay button
  - Dynamic action buttons (Demozoo, CSDB, Pouet, Download)
- `formatCredits(creditsArray)`: Groups contributors by role
- `handleFilterChange(event)`: Filters cards by data attributes (AND logic for type+platform)
- `setupMusicPlayerUI()`: Connects play/pause button to MusicPlayerManager

### musicPlayer.js — Music Playback
Architecture: Abstract base class + concrete implementation + singleton manager

- **BaseMusicPlayer**: Abstract interface (play/pause/stop/load)
- **ChiptuneMusicPlayer**: libopenmpt + ChiptuneJS implementation
  - Manages Web Audio API context
  - Loads tracker files (MOD, XM, IT, S3M)
  - 10-second timeout waiting for libopenmpt init
  - Event callbacks for errors and track end
- **MusicPlayerManager** (singleton): Public facade
  - `loadAndPlay(url, title)`, `togglePlayback()`, `stop()`
  - State callbacks: `onStateChange`, `onError`, `onTrackEnd`

---

## Theming

Two themes available, controlled by `site.theme` in `site.js`:

### theme-joe.css (Active Default)
- Dark background (black), light text (rgb(220 231 231))
- Accent colors: yellow glow (rgb(251 221 14)), orange (rgb(251 93 0))
- Fonts: 'Passero One' (headings), 'Edit Undo Brk' (body)
- Effects: text-shadow glow on hover, keyframe animations on nav items
- Drop-shadow filters on icon hover

### theme-first.css (Alternate)
- Light background, dark text
- Standard fonts (Helvetica/Arial)
- Inverted color scheme

Theme loaded via: `<link rel="stylesheet" href="/css/theme-{{ site.theme }}.css">`

CSS variables defined in `styles.css` control the color palette, font families, and heading sizes. Themes override these variables.

---

## Image Handling

### Sizes Generated
| Directory | Width | Use Case |
|-----------|-------|----------|
| `dist/img/orig/` | Full resolution | Modal/detail view |
| `dist/img/card/` | 400px | Card thumbnails |
| `dist/img/post/` | 150px | News post thumbnails |

All images converted to WebP via Sharp. Paths are resolved in transform scripts and stored in JSON data.

### Static Assets
- Favicons: favicon-32.png, -48.png, -192.png, -167.png, -180.png (Apple touch)
- Logos: trsi-logo.png, trsi-logo.webp, trsi-logo.svg
- Default music card image: music-player.webp

---

## Routing

| URL Path | Source Template | Notes |
|----------|----------------|-------|
| `/` | index.liquid | Home with featured content |
| `/about/` | about.liquid | Static about page |
| `/productions/` | productions.liquid | Paginated, 100 items, filterable |
| `/music/` | music.liquid | Hidden nav, feature-flagged |
| `/graphics/` | graphics.liquid | Paginated, filterable |
| `/members/` | members.liquid | Sorted by handle |
| `/news/` | news.liquid | Paginated news feed |
| `/news/{slug}/` | news-post.liquid | Individual posts (11ty pagination, size: 1) |
| `/sitemap.xml` | sitemap.xml.liquid | Auto-generated XML sitemap |
| `/404.html` | 404.html | Static error page |

---

## Environment Configuration

### Required .env Variables
```
DELIVERY_TOKEN=<contentful delivery API token>
MANAGEMENT_TOKEN=<contentful management API token>
NODE_ENV=production|development
```

### site.js Behavior
- `prodenv: true` → loads `main.min.css`, sets `domain` to `https://trsi.org`
- `prodenv: false` → loads individual CSS files, sets `domain` to `http://localhost:8080`

---

## Dependencies

### Core
- `@11ty/eleventy ^3.0.0` — Static site generator
- `contentful ^11.4.4` + `contentful-cli ^3.7.3` + `contentful-export ^7.21.44` — CMS
- `bulma ^1.0.3` — CSS framework
- `sharp ^0.33.5` — Image processing
- `dotenv ^16.4.7` — Environment variables

### CSS Pipeline
- `postcss ^8.5.1` + CLI + import + autoprefixer + cssnano + purgecss

### Testing
- `vitest ^3.2.4` — Test runner
- `@testing-library/dom ^10.4.1` + `jest-dom ^6.8.0` — DOM testing
- `jsdom ^26.1.0` — DOM simulation
- `playwright ^1.55.0` — E2E testing

---

## Key Patterns

### Transform Pattern
Each content type has a dedicated transform script following a consistent interface:
```js
export function transformType(data) {
  return data.entries
    .filter(e => e.sys.contentType.sys.id === 'type')
    .map(e => ({ /* mapped fields */ }));
}
```
Adding a new content type: create transform, register in `processContent.js`, add to `cms.js`, create template.

### Card → Modal Pattern
Cards store all data in `data-*` attributes. No server round-trips needed for modal content. Modal template dynamically shows/hides sections based on content type (video embed, image, music player, action buttons).

### Conditional CSS Loading
Production: single minified bundle. Development: individual files for faster iteration.

### Feature Flags
`?mode=wotw` URL parameter reveals hidden Music navigation item. Checked in `main.js` via `URLSearchParams`.

### Music Player Singleton
`MusicPlayerManager` uses singleton pattern with callback-based state management. UI layer is decoupled from playback implementation. Supports future player implementations via `BaseMusicPlayer` abstraction.

---

## SEO

- Open Graph meta tags (`og-tags.liquid`)
- JSON-LD structured data for posts (`jsonld-post.liquid`) and organization (`jsonld-organisation.liquid`)
- XML sitemap generation
- Canonical URLs based on environment domain
- robots.txt

---

## Performance Optimizations

1. WebP image conversion with multiple size variants
2. PurgeCSS removes ~60% unused Bulma CSS
3. cssnano minification
4. libopenmpt preloaded in background for instant music playback
5. Static HTML output — no server-side rendering needed
6. No JS bundler — individual modules loaded directly
