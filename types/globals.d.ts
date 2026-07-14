/**
 * Ambient declarations for the wasm playback engine loaded at runtime via
 * scriptLoader.js. These globals come from scriptprocessor_player.js and the
 * backend_*.js bundles, which are vendored and not part of the typecheck.
 */

interface ScriptNodePlayerBackendAdapter {
  getMaxPlaybackPosition(): number;
  getPlaybackPosition(): number;
  seekPlaybackPosition(ms: number): void;
}

interface ScriptNodePlayerSongInfo {
  title?: string;
  player?: string;
  [field: string]: string | number | undefined;
}

interface ScriptNodePlayerInstance {
  play(): void;
  pause(): void;
  resume(): void;
  isPaused(): boolean;
  getCurrentPlaytime(): number;
  getPlaybackPosition(): number;
  getMaxPlaybackPosition(): number;
  seekPlaybackPosition(ms: number): void;
  getSongInfo(): ScriptNodePlayerSongInfo;
  getVolume(): number;
  setVolume(value: number): void;
  getAudioContext(): AudioContext;
  _analyzerNode?: AnalyserNode;
  _backendAdapter?: ScriptNodePlayerBackendAdapter;
}

type ScriptNodePlayerLoadOptions = Record<string, string | number | boolean | string[]>;

declare class ScriptNodePlayer {
  static initialize(
    backend: object,
    onTrackEnd?: () => void,
    preload?: string[],
  ): Promise<ScriptNodePlayerInstance>;
  static getInstance(): ScriptNodePlayerInstance | undefined;
  static loadMusicFromURL(
    url: string,
    options?: ScriptNodePlayerLoadOptions,
    onCompleted?: (filename: string) => void,
    onFail?: (filename: string, error?: string) => void,
    onProgress?: (total: number, loaded: number) => void,
  ): Promise<void>;
}

declare class MPTBackendAdapter {
  constructor(...args: (string | number | boolean | string[] | (() => void))[]);
}
declare class SIDBackendAdapter {
  constructor(...args: (string | number | boolean | string[] | (() => void))[]);
}
declare class UADEBackendAdapter {
  constructor(...args: (string | number | boolean | string[] | (() => void))[]);
}

/** Emscripten runtime module exposed by each backend_*.js bundle. */
interface EmscriptenBackendModule {
  onRuntimeInitialized?: () => void;
  calledRun?: boolean;
  notReady?: boolean;
  _emu_load_file?: (...args: number[]) => number;
}

declare const backend_mpt: { Module?: EmscriptenBackendModule };
declare const backend_SID: { Module?: EmscriptenBackendModule };
declare const backend_UADE: { Module?: EmscriptenBackendModule };

interface Window {
  WASM_SEARCH_PATH?: string;
  ScriptNodePlayer?: typeof ScriptNodePlayer;
}
