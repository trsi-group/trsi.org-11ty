import { loadScript } from './scriptLoader.js';
import { waitUntil } from './waitFor.js';
import { waitUntilRunning, getAudioContext, AudioBlockedError } from './audioContext.js';

class SidMusicPlayer {
  constructor() {
    this.isInitialized = false;
    this.isPlaying = false;
    this.currentTrack = null;
    this.onErrorCallback = null;
    this.onEndedCallback = null;
    this.scriptNodePlayer = null;
    this.sidReady = false;
  }

  /**
   * The background preload and a tap both call this, so it hands out one shared
   * promise instead of starting a second initialisation the first would strand.
   * @returns {Promise<void>}
   */
  initialize() {
    if (!this._initPromise) {
      this._initPromise = this._initialize().catch((error) => {
        this._initPromise = null; // let a later tap try again
        throw error;
      });
    }
    return this._initPromise;
  }

  async _initialize() {
    if (this.isInitialized) return;

    try {
      await this._loadLibraries();
      await waitUntil(() => this._isSidReady(), { label: 'SID libraries' });
      this._markSidReady();
      this.isInitialized = true;
      console.log('SidMusicPlayer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SidMusicPlayer:', error);
      throw error;
    }
  }

  async _loadLibraries() {
    if (typeof ScriptNodePlayer !== 'undefined' && typeof SIDBackendAdapter !== 'undefined') return;
    if (!window.WASM_SEARCH_PATH) window.WASM_SEARCH_PATH = '/js/';
    await loadScript('/js/scriptprocessor_player.js');
    await loadScript('/js/backend_websid.js');
  }

  _isSidReady() {
    return typeof ScriptNodePlayer !== 'undefined' &&
      typeof SIDBackendAdapter !== 'undefined' &&
      typeof backend_SID !== 'undefined' &&
      backend_SID.Module.calledRun &&
      typeof backend_SID.Module._emu_load_file === 'function';
  }

  _markSidReady() {
    this.sidReady = true;
    if (backend_SID.Module.notReady) {
      backend_SID.Module.notReady = false;
    }
  }

  async _ensurePlayer() {
    if (this.scriptNodePlayer) return;

    const backend = new SIDBackendAdapter();

    const onTrackEnd = () => {
      this.isPlaying = false;
      this.currentTrack = null;
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    };

    await ScriptNodePlayer.initialize(backend, onTrackEnd);
    this.scriptNodePlayer = ScriptNodePlayer.getInstance();
  }

  async load(url, title) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    this.stop();
    await this._ensurePlayer();

    this.currentTrack = { url, title };

    const options = {
      track: -1,
      timeout: -1,
      traceSID: false
    };

    try {
      await new Promise((resolve, reject) => {
        const failTimeout = setTimeout(() => {
          reject(new Error('SID load timed out'));
        }, 15000);

        const promise = ScriptNodePlayer.loadMusicFromURL(
          url,
          options,
          (error) => {
            clearTimeout(failTimeout);
            reject(new Error(error || 'Failed to load SID file'));
          }
        );

        promise.then(() => {
          clearTimeout(failTimeout);
          resolve();
        });
      });
      console.log('SID loaded successfully:', title);
    } catch (error) {
      this.currentTrack = null;
      console.error('Failed to load SID file:', error);
      throw error;
    }
  }

  async play() {
    if (!this.scriptNodePlayer || !this.currentTrack) {
      throw new Error('No SID track loaded');
    }

    this.scriptNodePlayer.resume();

    // Asking is not the same as playing: iOS can keep the context suspended or
    // interrupted, and the UI must not claim otherwise.
    if (!(await waitUntilRunning())) {
      this.isPlaying = false;
      throw new AudioBlockedError(getAudioContext()?.state ?? 'unavailable');
    }

    this.isPlaying = true;
    console.log('SID started playing:', this.currentTrack.title);
  }

  pause() {
    if (this.scriptNodePlayer && this.isPlaying) {
      this.scriptNodePlayer.pause();
      this.isPlaying = false;
      console.log('SID paused');
    }
  }

  resume() {
    if (this.scriptNodePlayer && !this.isPlaying) {
      this.scriptNodePlayer.resume();
      this.isPlaying = true;
      console.log('SID resumed');
    }
  }

  stop() {
    if (this.scriptNodePlayer) {
      this.scriptNodePlayer.pause();
    }
    this.isPlaying = false;
    this.currentTrack = null;
    console.log('SID stopped');
  }

  togglePlayback() {
    if (!this.scriptNodePlayer) return;

    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  onError(callback) {
    this.onErrorCallback = callback;
  }

  onEnded(callback) {
    this.onEndedCallback = callback;
  }

  getIsPlaying() {
    return this.isPlaying;
  }

  getCurrentTrack() {
    return this.currentTrack;
  }
}

export { SidMusicPlayer };
