import { MptMusicPlayer } from './mptPlayer.js';
import { SidMusicPlayer } from './sidPlayer.js';
import { UadeMusicPlayer } from './uadePlayer.js';
class BaseMusicPlayer {
  constructor() {
    this.isInitialized = false;
    this.isPlaying = false;
    this.currentTrack = null;
    this.onErrorCallback = null;
    this.onEndedCallback = null;
  }

  /**
   * Initialize the music player
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * Load a music file
   * @param {string} url - URL to the music file
   * @param {string} title - Title of the track
   * @returns {Promise<void>}
   */
  async load(url, title) {
    throw new Error('load() must be implemented by subclass');
  }

  /**
   * Play the loaded track
   * @returns {Promise<void>}
   */
  async play() {
    throw new Error('play() must be implemented by subclass');
  }

  /**
   * Pause playback
   */
  pause() {
    throw new Error('pause() must be implemented by subclass');
  }

  /**
   * Resume playback
   */
  resume() {
    throw new Error('resume() must be implemented by subclass');
  }

  /**
   * Stop playback and clean up resources
   */
  stop() {
    throw new Error('stop() must be implemented by subclass');
  }

  /**
   * Toggle between play and pause
   */
  togglePlayback() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.resume();
    }
  }

  /**
   * Set error callback
   * @param {Function} callback
   */
  onError(callback) {
    this.onErrorCallback = callback;
  }

  /**
   * Set ended callback
   * @param {Function} callback
   */
  onEnded(callback) {
    this.onEndedCallback = callback;
  }

  /**
   * Get current playing state
   * @returns {boolean}
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * Get current track info
   * @returns {Object|null}
   */
  getCurrentTrack() {
    return this.currentTrack;
  }
}

/**
 * Music Player Manager
 * 
 * This class manages the music player instance and provides a simple interface
 * for the UI components.
 */
class MusicPlayerManager {
  constructor() {
    this.player = null;
    this.currentPlayerType = null;
    this.playerRegistry = {
      'MPT': MptMusicPlayer,
      'UADE': UadeMusicPlayer,
      'SID': SidMusicPlayer
    };
    this.uiCallbacks = {
      onStateChange: null,
      onError: null,
      onTrackEnd: null
    };
  }

  _setupPlayerCallbacks() {
    this.player.onError((error) => {
      if (this.uiCallbacks.onError) {
        this.uiCallbacks.onError(error);
      }
    });

    this.player.onEnded(() => {
      if (this.uiCallbacks.onTrackEnd) {
        this.uiCallbacks.onTrackEnd();
      }
      if (this.uiCallbacks.onStateChange) {
        this.uiCallbacks.onStateChange(false);
      }
    });
  }

  async initialize(playerType = 'MPT') {
    const PlayerClass = this.playerRegistry[playerType];
    if (!PlayerClass) {
      throw new Error(`Unknown player type: ${playerType}`);
    }

    this.player = new PlayerClass();
    this.currentPlayerType = playerType;
    this._setupPlayerCallbacks();
    await this.player.initialize();
  }

  async loadAndPlay(url, title, playerEmu) {
    const requestedType = playerEmu || 'MPT';

    if (!this.player || this.currentPlayerType !== requestedType) {
      this.stop();
      await this.initialize(requestedType);
    }

    try {
      await this.player.load(url, title);
      await this.player.play();

      if (this.uiCallbacks.onStateChange) {
        this.uiCallbacks.onStateChange(true);
      }
    } catch (error) {
      console.error('Failed to load and play music:', error);
      if (this.uiCallbacks.onError) {
        this.uiCallbacks.onError(error);
      }
    }
  }

  /**
   * Toggle playback (play/pause)
   */
  togglePlayback() {
    if (!this.player) return;
    
    this.player.togglePlayback();
    
    if (this.uiCallbacks.onStateChange) {
      this.uiCallbacks.onStateChange(this.player.getIsPlaying());
    }
  }

  /**
   * Stop playback
   */
  stop() {
    if (this.player) {
      this.player.stop();
      if (this.uiCallbacks.onStateChange) {
        this.uiCallbacks.onStateChange(false);
      }
    }
  }

  /**
   * Check if music is currently playing
   * @returns {boolean}
   */
  isPlaying() {
    return this.player ? this.player.getIsPlaying() : false;
  }

  /**
   * Get current track information
   * @returns {Object|null}
   */
  getCurrentTrack() {
    return this.player ? this.player.getCurrentTrack() : null;
  }

  /**
   * Set UI callback for state changes
   * @param {Function} callback - Called with (isPlaying: boolean)
   */
  onStateChange(callback) {
    this.uiCallbacks.onStateChange = callback;
  }

  /**
   * Set UI callback for errors
   * @param {Function} callback - Called with (error: Error)
   */
  onError(callback) {
    this.uiCallbacks.onError = callback;
  }

  /**
   * Set UI callback for track end
   * @param {Function} callback - Called when track ends
   */
  onTrackEnd(callback) {
    this.uiCallbacks.onTrackEnd = callback;
  }

  /**
   * Pre-load the music libraries for faster playback
   * @returns {Promise<void>}
   */
  async preload() {
    if (!this.player) {
      await this.initialize();
    }
  }
}

// Create and export a singleton instance
export const musicPlayerManager = new MusicPlayerManager();

export { BaseMusicPlayer, MusicPlayerManager };
