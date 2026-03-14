import { loadScript } from './scriptLoader.js';

class UadeMusicPlayer {
  constructor() {
    this.isInitialized = false;
    this.isPlaying = false;
    this.currentTrack = null;
    this.onErrorCallback = null;
    this.onEndedCallback = null;
    this.scriptNodePlayer = null;
    this.uadeReady = false;
  }

  async _loadLibraries() {
    if (typeof ScriptNodePlayer !== 'undefined' && typeof UADEBackendAdapter !== 'undefined') return;
    if (!window.WASM_SEARCH_PATH) window.WASM_SEARCH_PATH = '/js/';
    await loadScript('/js/scriptprocessor_player.js');
    await loadScript('/js/backend_uade.js');
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      await this._loadLibraries();
      await this._waitForUadeReady();
      this.isInitialized = true;
      console.log('UadeMusicPlayer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize UadeMusicPlayer:', error);
      throw error;
    }
  }

  _isUadeReady() {
    return typeof ScriptNodePlayer !== 'undefined' &&
      typeof UADEBackendAdapter !== 'undefined' &&
      typeof backend_UADE !== 'undefined' &&
      backend_UADE.Module.calledRun &&
      typeof backend_UADE.Module._emu_load_file === 'function';
  }

  _markUadeReady() {
    this.uadeReady = true;
    if (backend_UADE.Module.notReady) {
      backend_UADE.Module.notReady = false;
    }
  }

  async _waitForUadeReady() {
    if (this._isUadeReady()) {
      this._markUadeReady();
      return;
    }

    return new Promise((resolve, reject) => {
      const checkReady = () => {
        if (this._isUadeReady()) {
          this._markUadeReady();
          resolve();
        } else {
          setTimeout(() => {
            if (!this.uadeReady) checkReady();
          }, 100);
        }
      };
      checkReady();

      setTimeout(() => {
        if (!this.uadeReady) {
          reject(new Error('Timeout waiting for UADE libraries to load'));
        }
      }, 15000);
    });
  }

  async _ensurePlayer() {
    if (this.scriptNodePlayer) return;

    const backend = new UADEBackendAdapter('/uade', true, 0, () => {});

    const onTrackEnd = () => {
      this.isPlaying = false;
      this.currentTrack = null;
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    };

    const preload = [
      '/uade/uaerc',
      '/uade/eagleplayer.conf',
      '/uade/system/score'
    ];

    await ScriptNodePlayer.initialize(backend, onTrackEnd, preload);
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
      timeout: -1
    };

    try {
      await new Promise((resolve, reject) => {
        const failTimeout = setTimeout(() => {
          reject(new Error('UADE load timed out'));
        }, 15000);

        const promise = ScriptNodePlayer.loadMusicFromURL(
          url,
          options,
          (error) => {
            clearTimeout(failTimeout);
            reject(new Error(error || 'Failed to load UADE file'));
          }
        );

        promise.then(() => {
          clearTimeout(failTimeout);
          resolve();
        });
      });
      console.log('UADE loaded successfully:', title);
    } catch (error) {
      this.currentTrack = null;
      console.error('Failed to load UADE file:', error);
      throw error;
    }
  }

  async play() {
    if (!this.scriptNodePlayer || !this.currentTrack) {
      throw new Error('No UADE track loaded');
    }

    this.scriptNodePlayer.resume();
    this.isPlaying = true;
    console.log('UADE started playing:', this.currentTrack.title);
  }

  pause() {
    if (this.scriptNodePlayer && this.isPlaying) {
      this.scriptNodePlayer.pause();
      this.isPlaying = false;
      console.log('UADE paused');
    }
  }

  resume() {
    if (this.scriptNodePlayer && !this.isPlaying) {
      this.scriptNodePlayer.resume();
      this.isPlaying = true;
      console.log('UADE resumed');
    }
  }

  stop() {
    if (this.scriptNodePlayer) {
      this.scriptNodePlayer.pause();
    }
    this.isPlaying = false;
    this.currentTrack = null;
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

export { UadeMusicPlayer };
