# Plan: Unify MPT player to ScriptNodePlayer architecture

## Problem

SID and UADE both follow the wothke `ScriptNodePlayer` → `BackendAdapter` → `backend_*.js` → `.wasm` pattern. MPT is the odd one out — it uses a separate stack (`chiptune2.js` + `libopenmpt.js` + `libopenmpt.js.mem`) with its own Web Audio ScriptProcessor management.

This creates:
- Two different audio pipelines (ChiptuneJsPlayer vs ScriptNodePlayer)
- Two different initialization patterns
- Two different file loading mechanisms
- Inconsistent error handling across player types

## Solution

Replace the chiptune2.js/libopenmpt.js stack with `backend_mpt.js` + `mpt.wasm` + `MPTBackendAdapter` from the webmpt reference implementation (`/Users/oliver/Code/tmp/webmpt/emscripten/`). This makes all three players use the identical ScriptNodePlayer framework.

### Target architecture

| Layer | SID | UADE | MPT (new) |
|-------|-----|------|-----------|
| Framework | ScriptNodePlayer | ScriptNodePlayer | ScriptNodePlayer |
| Adapter | SIDBackendAdapter | UADEBackendAdapter | MPTBackendAdapter |
| Backend | backend_websid.js | backend_uade.js | backend_mpt.js |
| Binary | websid.wasm | uade.wasm | mpt.wasm |

## Todo list

- [x] Copy backend_mpt.js + mpt.wasm from webmpt, append MPTBackendAdapter
- [x] Create src/js/mptPlayer.js following uadePlayer.js pattern
- [x] Update musicPlayer.js: replace ChiptuneMusicPlayer with MptMusicPlayer import
- [x] Update base.liquid: add backend_mpt.js script tag
- [x] Delete dead files: chiptune2.js, libopenmpt.js, libopenmpt.js.mem
- [x] Test MOD playback end-to-end and player swap

## Implementation steps

### 1. Copy backend files from webmpt

- Copy `backend_mpt.js` from `/Users/oliver/Code/tmp/webmpt/emscripten/htdocs/backend_mpt.js` → `src/js/backend_mpt.js`
- Copy `mpt.wasm` from `/Users/oliver/Code/tmp/webmpt/emscripten/htdocs/mpt.wasm` → `src/js/mpt.wasm`
- Append `MPTBackendAdapter` class from `/Users/oliver/Code/tmp/webmpt/emscripten/mpt_adapter.js` to the end of `backend_mpt.js` (same pattern as SID/UADE where the adapter is bundled into the backend file)

### 2. Create MptMusicPlayer (src/js/mptPlayer.js)

New file following the exact same pattern as `uadePlayer.js`:
- `_isMptReady()` — checks for `ScriptNodePlayer`, `MPTBackendAdapter`, `backend_mpt.Module.calledRun`, `backend_mpt.Module._emu_load_file`
- `_markMptReady()` — clears `notReady` flag
- `_waitForMptReady()` — poll with timeout
- `_ensurePlayer()` — creates `MPTBackendAdapter`, initializes `ScriptNodePlayer`
- `load()` — uses `ScriptNodePlayer.loadMusicFromURL()` with Promise wrapper and timeout
- `play/pause/resume/stop/togglePlayback` — delegates to `scriptNodePlayer`

### 3. Update musicPlayer.js

- Import `MptMusicPlayer` from `./mptPlayer.js` (replaces inline `ChiptuneMusicPlayer`)
- Remove the entire `ChiptuneMusicPlayer` class
- Update `playerRegistry`: `'MPT': MptMusicPlayer`
- Remove `loadScript` import (no longer needed in this file)

### 4. Update base.liquid

- Add `<script src="/js/backend_mpt.js"></script>` alongside the other backend scripts

### 5. Remove dead files

- Delete `src/js/chiptune2.js`
- Delete `src/js/libopenmpt.js`
- Delete `src/js/libopenmpt.js.mem`

### 6. Test

- Verify MOD playback end-to-end (play/pause/stop)
- Verify player swap works (MPT → UADE → MPT)
- Verify no regression on SID/UADE playback
- Verify lazy loading still works (libraries not loaded on non-music pages)

## Risk assessment

- **mpt.wasm is 2.2MB** vs libopenmpt.js (~1.5MB) — slightly larger, but loaded once and cached
- **Static script tag** for backend_mpt.js on all pages — consistent with SID/UADE approach (Emscripten dynamic loading breaks WASM exports)
- **ScriptNodePlayer singleton** — SID/UADE/MPT share the same ScriptNodePlayer; `_ensurePlayer()` re-initializes it with the correct backend adapter when switching player types
