# Music Player — Deep Research Report

## Executive Summary

The music player is a partially implemented feature for playing demoscene tracker music (MOD, XM, IT, S3M formats) directly in the browser. It uses **libopenmpt** (an Emscripten-compiled C++ library) wrapped by **ChiptuneJS** (chiptune2.js), exposed through a custom three-layer JavaScript architecture. The feature is deliberately hidden behind a `?mode=wotw` URL parameter and the Music nav item is marked `hidden: true` in navigation data.

---

## Architecture Overview

The music player spans four layers:

```
┌─────────────────────────────────────┐
│  UI Layer (utils.js + modal HTML)   │  DOM manipulation, play/pause buttons
├─────────────────────────────────────┤
│  Manager (MusicPlayerManager)       │  Singleton facade, UI callbacks
├─────────────────────────────────────┤
│  Player (ChiptuneMusicPlayer)       │  Web Audio API, load/play/pause/stop
├─────────────────────────────────────┤
│  Engine (chiptune2.js + libopenmpt) │  Tracker format decoding, audio rendering
└─────────────────────────────────────┘
```

---

## Layer 1: Engine — libopenmpt + ChiptuneJS

### libopenmpt (`src/js/libopenmpt.js` + `libopenmpt.js.mem`)

- **Emscripten-compiled** C++ library (~1.2M JS + binary `.mem` file)
- Decodes tracker module formats (ProTracker MOD, FastTracker XM, Impulse Tracker IT, Scream Tracker S3M) into raw PCM audio
- Exposes C functions via Emscripten's `ccall`/`cwrap` pattern:
  - `_openmpt_module_create_from_memory` — creates a module from an ArrayBuffer
  - `_openmpt_module_read_float_stereo` — renders frames as stereo float PCM
  - `_openmpt_module_get_duration_seconds`, `_openmpt_module_get_position_seconds` — timing
  - `_openmpt_module_get_current_row/pattern/order`, `_openmpt_module_get_num_orders/patterns` — tracker metadata
  - `_openmpt_module_get_metadata`/`_openmpt_module_get_metadata_keys` — module metadata (title, author, etc.)
  - `_openmpt_module_set_repeat_count`, `_openmpt_module_set_render_param` — playback config
  - `_openmpt_module_destroy`, `_malloc`, `_free` — memory management
- **Initialization**: Configured in `base.liquid` `<head>` via `window.Module` object *before* the script loads:
  - `locateFile()` resolves `libopenmpt.js.mem` to `/js/libopenmpt.js.mem`
  - `onRuntimeInitialized()` sets `window.libopenmpt = window.Module` when ready
- Loaded as a regular `<script>` tag (not ES module), polluting global scope with `Module`/`libopenmpt`

### ChiptuneJS (`src/js/chiptune2.js`)

- Wrapper library around libopenmpt providing a friendlier JavaScript API
- Key classes:
  - **`ChiptuneJsConfig`**: Configuration holder — `repeatCount`, `stereoSeparation`, `interpolationFilter`, `context`
  - **`ChiptuneJsPlayer`**: Main player class

#### ChiptuneJsPlayer internals

- **Audio pipeline**: Uses the **deprecated** `createScriptProcessor` API (Web Audio ScriptProcessorNode) with buffer size 2048 and stereo output (0 inputs, 2 outputs)
- **Loading**: Supports both `File` objects (FileReader) and URLs (XHR with `arraybuffer` responseType)
- **Playback process** (`createLibopenmptNode`):
  1. Allocates Emscripten heap memory for the module file bytes
  2. Creates module via `_openmpt_module_create_from_memory`
  3. Allocates left/right float buffers (4096 frames max per chunk)
  4. Creates a ScriptProcessorNode with `onaudioprocess` callback that:
     - Reads stereo float PCM from libopenmpt in chunks
     - Copies data from Emscripten HEAPF32 to Web Audio output buffers
     - Detects end-of-module (0 frames returned) and fires `onEnded` or `onError`
     - Handles pause by outputting silence
  5. Connects node to `AudioContext.destination`
- **Metadata access**: `duration()`, `getCurrentRow()`, `getCurrentPattern()`, `getCurrentOrder()`, `getCurrentTime()`, `getTotalOrder()`, `getTotalPatterns()`, `metadata()` — all read from the live module pointer
- **Module control**: `module_ctl_set()` via Emscripten `ccall`
- **Touch unlock**: Creates a silent buffer and plays it to unlock AudioContext on mobile (iOS requirement)
- **Event system**: Simple handler array with `fireEvent(name, response)` — supports `onEnded` and `onError`
- **Cleanup**: `processNode.cleanup()` frees module pointer and audio buffers via `libopenmpt._free()`

#### Known issues in chiptune2.js

- Uses **`createScriptProcessor`** which is deprecated in the Web Audio API spec (should use `AudioWorkletNode`)
- Bug in `onaudioprocess`: line 224 checks `this.ModulePtr` (capital M) but the property is `this.modulePtr` (lowercase m) — this means the null-module-pointer check never triggers, potentially causing errors instead of graceful cleanup
- `load()` method has inconsistent callback signatures — success callback receives `buffer`, but the caller in `ChiptuneMusicPlayer.load()` expects a different pattern (callback-based, not Promise)
- No progress/position update events — metadata methods exist but nothing fires periodic updates

---

## Layer 2: Player — ChiptuneMusicPlayer

Defined in `src/js/musicPlayer.js`, extends `BaseMusicPlayer`.

### BaseMusicPlayer (Abstract base)

Abstract interface defining the player contract:
- State: `isInitialized`, `isPlaying`, `currentTrack`
- Methods: `initialize()`, `load(url, title)`, `play()`, `pause()`, `resume()`, `stop()`, `togglePlayback()`
- Callbacks: `onError(callback)`, `onEnded(callback)`
- All methods throw "must be implemented" errors by default

### ChiptuneMusicPlayer (Concrete implementation)

- **State**: `player` (ChiptuneJsPlayer instance), `context` (AudioContext), `libopenmptLoaded` flag

#### Initialization (`initialize()` → `waitForLibopenmptReady()`)
- Polls every 100ms for `window.libopenmpt._openmpt_module_create_from_memory` to exist
- Falls back to checking `window.Module._openmpt_module_create_from_memory`
- **10-second timeout** — rejects with error if libopenmpt doesn't load in time
- Idempotent — returns immediately if already initialized

#### Loading (`load(url, title)`)
- Auto-initializes if needed
- Validates both `window.libopenmpt` and `ChiptuneJsPlayer` exist
- **Stops any currently playing track first** (calls `this.stop()`)
- Creates a **new AudioContext** each time (one context per track)
- Config: `repeatCount=0` (no repeat), `stereoSeparation=100`, `interpolationFilter=8`
- Wires up `onError` and `onEnded` callbacks on the ChiptuneJsPlayer instance
- Returns a Promise wrapping the ChiptuneJS callback-based `load()`

#### Playing (`play()`)
- **Loads the file a second time** via `this.player.load()` then calls `this.player.play(buffer)` — the file is fetched twice (once in `load()`, once in `play()`)
- This is a design issue: `load()` fetches but doesn't store the buffer, `play()` re-fetches

#### Pause/Resume
- Delegates to `ChiptuneJsPlayer.togglePause()` which flips the `paused` flag on the ScriptProcessorNode

#### Stop
- Calls `player.stop()` (disconnects + cleans up node)
- Closes the AudioContext
- Nulls out player, context, and track info

#### togglePlayback (overrides base)
- Calls `player.togglePause()` directly
- Attempts to check `player.currentPlayingNode.paused` for actual state (but `paused` is a custom property, not the standard AudioNode property)

---

## Layer 3: Manager — MusicPlayerManager

Singleton facade in `src/js/musicPlayer.js`, exported as `musicPlayerManager`.

### Responsibilities
- Lazy-initializes the player on first use (`initialize(playerType='chiptune')`)
- Extensible via `playerType` switch (currently only `'chiptune'`)
- Bridges player events to UI callbacks: `onStateChange(isPlaying)`, `onError(error)`, `onTrackEnd()`
- Public API: `loadAndPlay(url, title)`, `togglePlayback()`, `stop()`, `isPlaying()`, `getCurrentTrack()`
- **`preload()`**: Pre-initializes the player (called at DOMContentLoaded via `preloadMusicLibraries()`)

### State management
- Callback-based, not event-based — only one listener per event type (last registered wins)
- `onStateChange` fires `true` after `loadAndPlay`, `false` on track end
- `togglePlayback` fires `onStateChange` with current playing state after toggle

---

## Layer 4: UI Integration

### Modal-based playback (`src/_includes/components/modal-template.liquid` + `src/js/utils.js`)

The music player UI lives **inside the shared modal overlay**, not on a dedicated page:

1. **Modal structure**: The modal template contains two `<figure>` elements:
   - Video figure (iframe for YouTube) — used by productions
   - Image figure with nested `#music-player-overlay` div — used by music

2. **Music player overlay** (`#music-player-overlay`):
   - Absolutely positioned over the card image
   - Semi-transparent black background (0.3 opacity, 0.5 on hover)
   - Contains a single `#play-pause-btn` button with two SVG icon spans:
     - `#play-icon` — circular play button (from `icons/play-button.svg`)
     - `#pause-icon` — circular pause button (from `icons/pause-button.svg`, hidden by default)
   - Icons are white-filled SVGs with drop-shadow, scale to 25% of container (60px–120px)

3. **Modal population flow** (`populateModal()` in utils.js):
   - When `data.ctype == 'music'`:
     - Shows the image figure with the card_image (all tracks currently share `/img/music-player.webp`)
     - Hides the video figure
     - **Removes** `is-hidden` from `#music-player-overlay`
     - Calls `setupMusicPlayerUI(data.download, data.title)`
   - For other content types, overlay is hidden via `classList.add('is-hidden')`

4. **`setupMusicPlayerUI(downloadUrl, title)`** in utils.js:
   - Validates DOM elements exist
   - Resets play/pause icon state
   - **Clones the button** to remove old event listeners (prevents accumulation)
   - Registers `onStateChange`, `onError`, `onTrackEnd` callbacks on the manager
   - Click handler:
     - If not playing and no track loaded → `loadAndPlay(downloadUrl, title)`
     - Otherwise → `togglePlayback()`
   - Error handler shows `alert()` to user

5. **Modal close** (`closeModal()` in utils.js):
   - Calls `musicPlayerManager.stop()` — **music stops when modal closes**
   - Also stops YouTube iframes

### CSS Styling (`src/css/styles.css`, lines 303–368)

```
.music-player-overlay     — absolute fill, flex centered, z-index 10
.music-player-button      — transparent, 25% size, 60–120px range, scale on hover
.music-player-icon svg    — white fill, drop-shadow
.music-player-icon.is-hidden — display: none !important
```

### Navigation hiding

- `src/_data/navdata.json`: Music item has `"hidden": true`
- `src/_includes/sections/header.liquid`: Items with `hidden == true` get CSS class `hide` → `display: none`
- `src/js/main.js` (lines 84–94): Checks `?mode=wotw` URL param, finds "Music" nav item by text, sets `display: flex`
- The `/music` page itself **still exists and is accessible** by direct URL

---

## Content Pipeline

### Contentful CMS Schema (music content type)

Fields from `cms/scripts/transformMusic.js`:
| CMS Field | JSON Key | Description |
|-----------|----------|-------------|
| `title` | `title` | Track title |
| `type` | `type` | Music sub-type (e.g., "Tracked Music") |
| `platform` | `platform` | Target platform (e.g., "Amiga") |
| `infoText` | `nfo_text` | NFO/info text |
| `track` (asset ref) | `asset`, `assetId` | Path to track file, Contentful asset ID |
| `playerEmu` | `playerEmu` | Player/emulator type (e.g., "MPT", "UADE") |
| `description` (rich text) | `description` | Extracted plain text from first paragraph |
| `releaseDate` | `release_date` | ISO date string |
| `image` (asset ref) | `card_image` | Card image path (fallback: `/img/music-player.webp`) |
| `download` | `download` | External download URL |
| `demozooUrl` | `demozoo` | Demozoo page URL |
| `kestraUrl` | `kestra` | Kestra/Exotica URL |
| `credits` (JSON array) | `credits` | `[{name, contribution}]` |
| `metadata.tags` | `tags` | Contentful tag IDs |

### Track asset pipeline (`cms/scripts/copyTrackAssets.js`)

- Filters entries for content type `music`
- For each entry with a `track` asset reference:
  - Finds the asset in Contentful's asset list
  - Resolves filename (spaces → underscores)
  - Recursively searches the Contentful export asset directory for the file
  - Copies to `dist/tracks/{filename}`
- Source: `cms/export/assets.ctfassets.net/`
- Destination: `dist/tracks/`

### Eleventy passthrough

- `src/js/` → `dist/js/` (includes musicPlayer.js, chiptune2.js, libopenmpt.js, libopenmpt.js.mem)
- `cms/data/` → `dist/data/` (includes music.json)
- **Note**: No explicit passthrough for `dist/tracks/` — tracks are copied by `copyTrackAssets.js` during build, not by Eleventy

### Card template (`src/_includes/components/card-music.liquid`)

Data attributes embedded on music cards:
- `data-ctype="music"` (hardcoded)
- `data-slug` (from title, slugified)
- `data-download`, `data-demozoo`, `data-credits`, `data-description`, `data-release_date`, `data-format`
- Card image shown only if `card.asset` exists (the track file, not the image)
- "Show Infos" button triggers modal

### Music page (`src/music.liquid`)

- Uses base layout with pagination (100 items per page)
- Has Type and Platform filter dropdowns
- Renders `feed-cards` component with `type: "music"`
- Includes modal template
- **Not shown on homepage** — only productions, graphics, and news appear on index

---

## Current Music Data

Five tracks in `cms/data/music.json`:

| Title | Platform | Date | Artist(s) | PlayerEmu | Format |
|-------|----------|------|-----------|-----------|--------|
| Boesendorfer P.S.S. | Amiga | 1992-11-28 | Romeo Knight | MPT | .mod (ProTracker) |
| Rusted Blues | Amiga | 2024-10-05 | W.O.T.W. & JOSSS | MPT | .mod |
| Escaping Tartarus | Amiga | 2024-10-05 | W.O.T.W. | MPT | .mod |
| Samsara | Amiga | 2025-04-19 | W.O.T.W. | MPT | .mod |
| Beat To The Pulp | Amiga | 1990-09-25 | Romeo Knight | UADE | .sid (SidMon) |

Observations:
- All tracks use the default card image (`/img/music-player.webp`) — no custom images
- All `type` values are "Tracked Music" — no variety for filtering
- All `platform` values are "Amiga"
- `playerEmu` field exists ("MPT" or "UADE") but is **never used in the player code** — the player treats all files the same via libopenmpt
- "Beat To The Pulp" is a `.sid` file (SidMon format) — libopenmpt may or may not support SidMon modules (it primarily handles ProTracker/FastTracker/ImpulseTracker/ScreamTracker)
- Download URLs point to external sites (exotica.org.uk, scene.org, modland.com) — these are used as the **playback source URL** since `data.download` is passed to `setupMusicPlayerUI()`
- The `asset` field points to local track files in `/tracks/` but the player uses the `download` URL instead

---

## Playback Flow (End to End)

1. Page loads → `base.liquid` injects `window.Module` config, loads `libopenmpt.js` and `chiptune2.js` as global scripts
2. `main.js` DOMContentLoaded → calls `preloadMusicLibraries()` → `musicPlayerManager.preload()` → creates `ChiptuneMusicPlayer`, calls `waitForLibopenmptReady()` (polls until library ready, 10s timeout)
3. User navigates to `/music` (or `/music?mode=wotw` if discovering via nav) → sees card grid
4. User clicks "Show Infos" on a music card → `getDataFromCard()` extracts data attributes → `populateModal()` runs
5. For `ctype == 'music'`: shows card image with play overlay, calls `setupMusicPlayerUI(download_url, title)`
6. User clicks play button → `musicPlayerManager.loadAndPlay(url, title)`
7. Manager delegates to `ChiptuneMusicPlayer.load()`:
   - Creates new AudioContext
   - Creates ChiptuneJsPlayer with config (no repeat, stereo sep 100, interp filter 8)
   - XHR fetches the tracker file from the download URL
8. After load resolves → `ChiptuneMusicPlayer.play()`:
   - **XHR fetches the file again** (double fetch issue)
   - `ChiptuneJsPlayer.play(buffer)` → `createLibopenmptNode(buffer, config)`
   - Module created in Emscripten memory, ScriptProcessorNode renders audio
9. Play icon swaps to pause icon via `onStateChange(true)`
10. User clicks pause → `togglePlayback()` → `togglePause()` on ScriptProcessorNode
11. User closes modal → `closeModal()` → `musicPlayerManager.stop()` → AudioContext closed, module destroyed

### Exclusive playback constraint

Only one track may play at a time. Clicking any play button must first stop the currently playing track and clean up all its resources (AudioContext, ScriptProcessorNode, Emscripten module memory) before starting the new track. Currently, `ChiptuneMusicPlayer.load()` does call `this.stop()` first, so the intent is present — but the AudioContext leak (see Bug #4 below) undermines this: closed contexts are not reclaimed, and new ones are created each time. The fix is to reuse a single AudioContext (see proposal under Bug #4).

---

## Issues and Incomplete Items

### Bugs

1. **Double file fetch**: `ChiptuneMusicPlayer.load()` fetches the file, then `play()` fetches it again. The buffer from `load()` is never stored or passed to `play()`.

2. **Case sensitivity bug in chiptune2.js** (line 224): `this.ModulePtr` should be `this.modulePtr`. The null-pointer check for a destroyed module never works. This is a third-party library, but the upstream repo contains the same bug in its latest version, so we should fix it locally in our copy.

3. **External URL playback**: The player uses `data.download` (external URLs like exotica.org.uk) as the playback source. These URLs may have CORS restrictions, rate limiting, or may not serve the expected binary format. The local `asset` paths (`/tracks/...`) exist but are not used for playback.

   **Proposed fix**: Change the playback source from `data.download` to `data.asset` (the local track path). The tracks are already downloaded from Contentful during build and copied to `dist/tracks/` by `copyTrackAssets.js`. The data pipeline in `card-music.liquid` needs to expose `data-asset` on the card element, and `getDataFromCard()` already extracts it. Then `populateModal()` should pass `data.asset` (the local `/tracks/...` URL) to `setupMusicPlayerUI()` instead of `data.download`. The `download` URL remains available for the "Download" button linking users to the external source. This eliminates CORS issues and ensures playback works even if external hosting disappears.

4. **New AudioContext per track**: Each `load()` creates a new AudioContext. Browsers limit the number of AudioContexts (Chrome: ~6). Rapid track switching could exhaust this limit.

   **Proposed fix**: Since only one track ever plays at a time, we can create a **single AudioContext** in `ChiptuneMusicPlayer` during `initialize()` and reuse it across all track loads. On `stop()`, instead of closing the context, we only disconnect and clean up the ScriptProcessorNode and Emscripten module memory. The context is kept alive and reused for the next `load()`. The context would only be closed on page unload or if the player is explicitly destroyed. If the context enters a `suspended` state (e.g. browser tab backgrounding), call `context.resume()` before playback. The `ChiptuneJsConfig` already accepts an external `context` parameter, so pass the persistent context into it each time.

5. **Single callback overwrite**: `musicPlayerManager.onStateChange()` replaces the previous callback. If `setupMusicPlayerUI` is called multiple times (multiple modal opens), the old modal's cloned button still references the manager but callbacks point to new elements. The button clone mitigates this somewhat.

   **Proposed fix**: Since there is only ever one modal open at a time (and the button is cloned each time to remove old listeners), the single-callback pattern actually works correctly for this use case. The cloned button gets fresh event listeners, and the manager callbacks are re-registered to point at the current DOM elements. No change needed — the current design is sound given the single-modal constraint. If we ever move to a non-modal UI (e.g. a persistent player bar), we would switch to an EventTarget/EventEmitter pattern with `addEventListener`/`removeEventListener`.

### Missing Features

1. ~~**No progress bar / seek**~~: Out of scope for now. The engine APIs exist (`getCurrentTime()`, `duration()`) for future use.

2. ~~**No track metadata display**~~: Out of scope. Track metadata is managed in Contentful CMS where it can be curated and controlled directly.

3. ~~**No pattern/row visualization**~~: Out of scope for now.

4. ~~**No playlist / auto-advance**~~: Out of scope. Only a single track plays at a time by design.

5. ~~**No volume control**~~: Out of scope. System volume control is sufficient.

6. **`playerEmu` field unused — multi-format player support needed**: The CMS has a `playerEmu` field ("MPT" or "UADE") that identifies which playback engine a track requires, but the code currently routes all tracks through libopenmpt regardless. SidMon `.sid` files (like "Beat To The Pulp") need a SID-specific player, not libopenmpt.

   **Proposed fix**: Introduce a `playerEmu` → player implementation mapping in `MusicPlayerManager`. The `BaseMusicPlayer` abstraction already supports this — we need:
   - A **format-to-player registry** (e.g. `{ 'MPT': ChiptuneMusicPlayer, 'UADE': SidMusicPlayer }`)
   - Pass `playerEmu` through the data pipeline: `card-music.liquid` → `data-playeremu` attribute → `getDataFromCard()` → `populateModal()` → `setupMusicPlayerUI()` → `musicPlayerManager.loadAndPlay(url, title, playerEmu)`
   - `MusicPlayerManager.loadAndPlay()` checks if the current player matches the requested `playerEmu`; if not, stops the current player and instantiates the correct one from the registry
   - A new `SidMusicPlayer extends BaseMusicPlayer` using a SID playback library (e.g. [jsSID](https://hermit.sidrip.com/jsSID/), [WebSID](https://www.niclas-one.de/websid/), or [SAM/UADE.js](https://github.com/AaronC81/uade.js)) for UADE-tagged tracks
   - Since only one track plays at a time, the manager can hold the active player instance and swap it as needed

7. **No `kestra` button in modal**: The transform extracts `kestra` URLs but the modal template has no button for Kestra/Exotica links. Should be added as another action button alongside Demozoo, CSDB, Pouet, and Download. Requires: adding a `<button>` in `modal-template.liquid`, passing `data-kestra` on the card, handling it in `populateModal()`.

8. **Local track playback not wired up**: All tracks are available as binaries from the CMS and are already copied to `dist/tracks/` during the build. The player should use these local files (`data.asset`) instead of external download URLs (`data.download`) to avoid dependency on third-party hosting that could disappear. See Bug #3 for the full fix proposal.

9. ~~**Filter dropdown ineffective**~~: Not an issue — more diverse data is planned for CMS.


### Technical Debt

1. **Deprecated Web Audio API**: `createScriptProcessor` is deprecated. The modern replacement is `AudioWorkletNode` which runs in a separate thread and offers better performance.

2. **Global script pollution + no lazy loading**: `libopenmpt.js` (~1.2MB) and `chiptune2.js` are loaded as global `<script>` tags on **every page**, not just music pages. This wastes bandwidth for users who never visit `/music`.

   **Proposed fix — lazy loading via dynamic script injection**:
   - Remove the `<script>` tags for `libopenmpt.js` and `chiptune2.js` from `base.liquid`
   - Remove the `window.Module` configuration block from `base.liquid`
   - Move library loading into `musicPlayer.js`, triggered only when `initialize()` is called:
     ```
     async initialize() {
       // 1. Inject window.Module config
       // 2. Dynamically create <script> elements for libopenmpt.js and chiptune2.js
       // 3. Wait for onRuntimeInitialized
       // 4. Proceed with waitForLibopenmptReady()
     }
     ```
   - `preloadMusicLibraries()` in `main.js` should be conditional — only call it if the current page is `/music` (check `window.location.pathname`), or skip preloading entirely and let the first play click trigger lazy init (adds ~1-2s on first play but saves bandwidth on all other pages)
   - This also addresses the **mixed module systems** issue: since `musicPlayer.js` controls when the globals are injected, the lifecycle is explicit rather than relying on script load order in HTML

3. **Mixed module systems**: `musicPlayer.js` uses ES modules (`export`), but `chiptune2.js` and `libopenmpt.js` use globals. The bridge is `window.libopenmpt` / `window.ChiptuneJsPlayer`. This is an inherent limitation of the third-party libraries (Emscripten output + legacy ChiptuneJS). The lazy loading approach above makes this manageable by keeping the globals scoped to the player initialization lifecycle. No further action needed unless we want to fork and refactor these libraries.

4. **`alert()` for errors**: The error handler in `setupMusicPlayerUI` uses `alert()`. Should be replaced with `console.error()` logging — no user-facing error dialog needed.


---

## File Inventory

| File | Role | Lines |
|------|------|-------|
| `src/js/libopenmpt.js` | Emscripten-compiled tracker decoder | ~1.2M (minified) |
| `src/js/libopenmpt.js.mem` | Memory initialization file for libopenmpt | Binary |
| `src/js/chiptune2.js` | JavaScript wrapper for libopenmpt | 272 |
| `src/js/musicPlayer.js` | Player abstraction + manager singleton | 469 |
| `src/js/main.js` | Entry point, preloading, wotw mode | 95 |
| `src/js/utils.js` | Music player UI setup, modal integration | 356 |
| `src/music.liquid` | Music page template | 26 |
| `src/_includes/components/card-music.liquid` | Music card template | 30 |
| `src/_includes/components/modal-template.liquid` | Shared modal with player overlay | 59 |
| `src/_includes/layouts/base.liquid` | Module config + script loading | 57 |
| `src/css/styles.css` | Player overlay CSS (lines 303–368) | 66 (player section) |
| `src/icons/play-button.svg` | Play icon SVG | 18 |
| `src/icons/pause-button.svg` | Pause icon SVG | 29 |
| `src/_data/navdata.json` | Navigation data (music hidden) | 25 |
| `cms/scripts/transformMusic.js` | CMS data transform | 70 |
| `cms/scripts/copyTrackAssets.js` | Track file copier | 72 |
| `cms/data/music.json` | Processed music data (5 tracks) | 117 |
| `src/public/img/music-player.webp` | Default music card image | Static asset |

---

## WOTW Feature Flag (to be removed)

The `?mode=wotw` URL parameter is redundant — the Music nav item is already hidden via `navdata.json` (`"hidden": true`) and the `/music` route is always accessible by direct URL. The WOTW code in `main.js` (lines 84–94) should be removed as dead code.

"WOTW" likely refers to **W.O.T.W.**, one of the music contributors who appears on 3 of 5 tracks.

---

## Implementation Plan

### Phase 1: Bug Fixes (core playback reliability)

These fix the fundamental playback issues and must be done first, as later phases depend on a working player.

- [x] **1.1 Fix double file fetch (Bug #1)**
  - File: `src/js/musicPlayer.js` — `ChiptuneMusicPlayer`
  - Store the loaded `ArrayBuffer` from `load()` as `this.loadedBuffer`
  - Change `play()` to use `this.loadedBuffer` instead of calling `this.player.load()` a second time
  - Call `this.player.play(this.loadedBuffer)` directly
  - Clear `this.loadedBuffer` on `stop()`

- [x] **1.2 Fix chiptune2.js case sensitivity bug (Bug #2)**
  - File: `src/js/chiptune2.js` — line 224
  - Change `this.ModulePtr` → `this.modulePtr`
  - Add a code comment noting this is a local fix for an upstream bug

- [x] **1.3 Switch to local track playback (Bug #3 + Missing #8)**
  - File: `src/_includes/components/card-music.liquid`
    - Add `data-asset='{{ card.asset }}'` attribute to the card div
  - File: `src/js/utils.js` — `populateModal()`
    - Change `setupMusicPlayerUI(data.download, data.title)` → `setupMusicPlayerUI(data.asset, data.title)`
    - `data.download` continues to be used only for the "Download" action button

- [x] **1.4 Reuse single AudioContext (Bug #4)**
  - File: `src/js/musicPlayer.js` — `ChiptuneMusicPlayer`
  - Create `this.context` once in `initialize()` instead of in `load()`
  - In `load()`: reuse `this.context`, call `this.context.resume()` if suspended, pass it into `ChiptuneJsConfig`
  - In `stop()`: disconnect and clean up the ScriptProcessorNode and Emscripten module, but do **not** close the AudioContext
  - Add a `destroy()` method that closes the AudioContext for explicit teardown

- [x] **1.5 Replace alert() with console.error (Tech Debt #4)**
  - File: `src/js/utils.js` — `setupMusicPlayerUI()`
  - Replace `alert('Failed to load music player...')` with `console.error('Music player error:', error)`

### Phase 2: Dead Code Removal

Clean up code that is no longer needed before adding new features.

- [x] **2.1 Remove WOTW feature flag**
  - File: `src/js/main.js` — lines 84–94
  - Delete the `URLSearchParams` check and the `navItems.forEach` block that reveals the Music nav item
  - Removed unused `musicPlayerManager` import from `main.js`
  - The `/music` route remains accessible by direct URL; nav visibility is controlled by `navdata.json`

### Phase 3: Data Pipeline Enhancements

Wire up missing data attributes so the UI and player can use them.

- [x] **3.1 Pass `playerEmu` through the data pipeline**
  - File: `src/_includes/components/card-music.liquid`
    - Add `data-playeremu='{{ card.playerEmu }}'` attribute to the card div
  - File: `src/js/utils.js` — `getDataFromCard()`
    - Add `playerEmu: $card.dataset.playeremu || null` to the returned data object
  - File: `src/js/utils.js` — `populateModal()`
    - Pass `data.playerEmu` to `setupMusicPlayerUI(data.asset, data.title, data.playerEmu)`
  - File: `src/js/utils.js` — `setupMusicPlayerUI()`
    - Accept third parameter `playerEmu`
    - Pass it through to `musicPlayerManager.loadAndPlay(downloadUrl, title, playerEmu)`

- [x] **3.2 Pass `kestra` through the data pipeline**
  - File: `src/_includes/components/card-music.liquid`
    - Add `data-kestra='{{ card.kestra }}'` attribute to the card div
  - File: `src/js/utils.js` — `getDataFromCard()`
    - Add `kestra: $card.dataset.kestra || null` to the returned data object

- [x] **3.3 Add Kestra button to modal (Missing #7)**
  - File: `src/_includes/components/modal-template.liquid`
    - Add `<button class="button is-outlined is-rounded mx-3">Kestra</button>` alongside the other action buttons
  - File: `src/js/utils.js` — `populateModal()`
    - Add a `text === 'kestra'` case to the button loop that opens `data.kestra` in a new tab

### Phase 4: Multi-Format Player Support (Missing #6)

Introduce the ability to play different track formats with different player engines, driven by the `playerEmu` CMS field.

- [ ] **4.1 Refactor MusicPlayerManager for multi-player support**
  - File: `src/js/musicPlayer.js` — `MusicPlayerManager`
  - Add a `playerRegistry` map: `{ 'MPT': ChiptuneMusicPlayer }` (SID added later)
  - Add `this.currentPlayerType` to track the active player type
  - Change `initialize(playerType)` to look up the registry and instantiate the matching class
  - Change `loadAndPlay(url, title, playerEmu)`:
    - Accept `playerEmu` parameter (default `'MPT'`)
    - If `playerEmu` differs from `this.currentPlayerType`, call `stop()` on the current player, then `initialize(playerEmu)` to create the new player type
    - Proceed with `load()` and `play()` as before

- [ ] **4.2 Research and select a SID/UADE playback library**
  - do deep analysis and reuse existing websid player, available at location
    /Users/oliver/Code/tmp/websid
  - build toolchain required (must work as a standalone script like chiptune2.js)
  - Test with the "Beat To The Pulp" `.sid` file from the CMS data

- [ ] **4.3 Implement SidMusicPlayer**
  - File: `src/js/sidPlayer.js` (new file)
  - Create `SidMusicPlayer extends BaseMusicPlayer` using the chosen SID library
  - Implement: `initialize()`, `load(url, title)`, `play()`, `pause()`, `resume()`, `stop()`, `togglePlayback()`
  - Follow same AudioContext-reuse pattern as ChiptuneMusicPlayer (Phase 1.4)
  - Wire up `onError` and `onEnded` callbacks

- [ ] **4.4 Register SidMusicPlayer in the player registry**
  - File: `src/js/musicPlayer.js`
  - Import `SidMusicPlayer` from `./sidPlayer.js`
  - Add `'UADE': SidMusicPlayer` to the `playerRegistry`

- [ ] **4.5 Add SID library to the project**
  - Copy the chosen SID library JS file(s) to `src/js/`
  - These will be lazy-loaded (see Phase 5), not added to `base.liquid`

### Phase 5: Lazy Loading (Tech Debt #2 + #3)

Move library loading out of `base.liquid` so non-music pages don't download ~1.2MB of JS.

- [ ] **5.1 Add dynamic script loader utility**
  - File: `src/js/musicPlayer.js` (or a new `src/js/scriptLoader.js`)
  - Create a `loadScript(src)` function that returns a Promise:
    - Creates a `<script>` element, sets `src`, appends to `<head>`
    - Resolves on `onload`, rejects on `onerror`
    - Tracks already-loaded scripts to avoid duplicates

- [ ] **5.2 Move libopenmpt + chiptune2 loading into ChiptuneMusicPlayer.initialize()**
  - File: `src/js/musicPlayer.js` — `ChiptuneMusicPlayer.initialize()`
  - Before calling `waitForLibopenmptReady()`:
    - Inject `window.Module` config (locateFile + onRuntimeInitialized)
    - Call `loadScript('/js/libopenmpt.js')`
    - Call `loadScript('/js/chiptune2.js')`
    - Wait for both to load
  - File: `src/_includes/layouts/base.liquid`
    - Remove the `<script>` block that configures `window.Module`
    - Remove the `<script src="/js/libopenmpt.js">` tag
    - Remove the `<script src="/js/chiptune2.js">` tag

- [ ] **5.3 Apply same lazy loading to SID library**
  - File: `src/js/sidPlayer.js` — `SidMusicPlayer.initialize()`
  - Dynamically load the SID library script only when a UADE track is first played

- [ ] **5.4 Make preloading conditional**
  - File: `src/js/main.js` — `preloadMusicLibraries()` call
  - Wrap in a path check: only preload on `/music` page
    ```
    if (window.location.pathname.startsWith('/music')) {
      preloadMusicLibraries();
    }
    ```
  - On all other pages, libraries load on-demand at first play click (~1-2s delay, acceptable)

### Phase 6: Verification

- [ ] **6.1 Test MOD playback end-to-end**
  - Build the site (`npm run build`)
  - Navigate to `/music`, open a MOD track modal, verify play/pause/stop work
  - Verify local track file is loaded (not external URL) — check Network tab
  - Verify AudioContext is reused across multiple track plays (no context exhaustion)
  - Verify closing modal stops playback and cleans up resources

- [ ] **6.2 Test SID playback end-to-end**
  - Open "Beat To The Pulp" modal, verify it uses SidMusicPlayer (not ChiptuneMusicPlayer)
  - Verify play/pause/stop work for SID format
  - Verify switching between a MOD track and a SID track works (player swap)

- [ ] **6.3 Test lazy loading**
  - Navigate to a non-music page (e.g. `/productions`)
  - Verify libopenmpt.js and chiptune2.js are NOT loaded (check Network tab)
  - Navigate to `/music`, verify libraries load on page entry (preload)
  - On a non-music page, if a music card appears (e.g. homepage), verify libraries load on first play click

- [ ] **6.4 Test Kestra button**
  - Open a music modal for a track that has a `kestra` URL
  - Verify the Kestra button appears and opens the correct URL
  - Open a music modal for a track without a `kestra` URL — verify button is hidden

- [ ] **6.5 Regression: non-music modals**
  - Verify productions modal still shows YouTube iframe correctly
  - Verify graphics modal still shows full image correctly
  - Verify music player overlay is hidden for non-music modals
