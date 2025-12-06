/**
 * Abstract Music Player Module
 * 
 * This module provides an abstraction layer for playing tracked music files.
 * The implementation can be easily swapped out by changing the concrete player class.
 */

/**
 * Abstract base class for music player implementations
 */
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
 * ChiptuneJS implementation of the music player
 */
class ChiptuneMusicPlayer extends BaseMusicPlayer {
  constructor() {
    super();
    this.player = null;
    this.context = null;
    this.libopenmptLoaded = false;
  }

  /**
   * Initialize the ChiptuneJS player
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      await this.waitForLibopenmptReady();
      this.isInitialized = true;
      console.log('ChiptuneMusicPlayer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ChiptuneMusicPlayer:', error);
      throw error;
    }
  }

  /**
   * Wait for libopenmpt to be ready and initialized
   * @returns {Promise<void>}
   */
  async waitForLibopenmptReady() {
    return new Promise((resolve, reject) => {
      const checkReady = () => {
        // Check if libopenmpt is available and has the required functions
        if (typeof window.libopenmpt !== 'undefined' && 
            window.libopenmpt._openmpt_module_create_from_memory) {
          console.log('libopenmpt is ready');
          this.libopenmptLoaded = true;
          resolve();
        } else if (typeof window.Module !== 'undefined' && 
                   window.Module._openmpt_module_create_from_memory) {
          window.libopenmpt = window.Module;
          this.libopenmptLoaded = true;
          resolve();
        } else {
          // Add timeout to prevent infinite waiting
          setTimeout(() => {
            if (!this.libopenmptLoaded) {
              checkReady();
            }
          }, 100);
        }
      };
      checkReady();
      
      // Add overall timeout
      setTimeout(() => {
        if (!this.libopenmptLoaded) {
          reject(new Error('Timeout waiting for libopenmpt to load'));
        }
      }, 10000); // 10 second timeout
    });
  }

  /**
   * Load a music file
   * @param {string} url - URL to the music file
   * @param {string} title - Title of the track
   * @returns {Promise<void>}
   */
  async load(url, title) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // Verify libraries are available
    if (typeof window.libopenmpt === 'undefined') {
      throw new Error('libopenmpt is not available');
    }
    
    if (typeof ChiptuneJsPlayer === 'undefined') {
      throw new Error('ChiptuneJsPlayer is not available');
    }

    // Stop any currently playing music
    this.stop();

    // Create player instance
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    const config = new ChiptuneJsConfig(0, 100, 8, this.context); // 0 = no repeat
    
    this.player = new ChiptuneJsPlayer(config);
    
    // Set up event handlers
    this.player.onError((error) => {
      console.error('ChiptuneMusicPlayer error:', error);
      this.isPlaying = false;
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    });
    
    this.player.onEnded(() => {
      this.isPlaying = false;
      this.currentTrack = null;
      if (this.onEndedCallback) {
        this.onEndedCallback();
      }
    });

    // Store track info
    this.currentTrack = { url, title };

    return new Promise((resolve, reject) => {
      this.player.load(url, (buffer) => {
        console.log('Music loaded successfully:', title);
        resolve();
      }, (error) => {
        console.error('Failed to load music:', error);
        reject(error);
      });
    });
  }

  /**
   * Play the loaded track
   * @returns {Promise<void>}
   */
  async play() {
    if (!this.player || !this.currentTrack) {
      throw new Error('No track loaded');
    }

    return new Promise((resolve, reject) => {
      try {
        this.player.load(this.currentTrack.url, (buffer) => {
          this.player.play(buffer);
          this.isPlaying = true;
          console.log('Music started playing:', this.currentTrack.title);
          resolve();
        });
      } catch (error) {
        console.error('Failed to play music:', error);
        reject(error);
      }
    });
  }

  /**
   * Pause playback
   */
  pause() {
    if (this.player && this.isPlaying) {
      this.player.togglePause();
      this.isPlaying = false;
      console.log('Music paused');
    }
  }

  /**
   * Resume playback
   */
  resume() {
    if (this.player && !this.isPlaying) {
      this.player.togglePause();
      this.isPlaying = true;
      console.log('Music resumed');
    }
  }

  /**
   * Stop playback and clean up resources
   */
  stop() {
    if (this.player) {
      this.player.stop();
      this.player = null;
    }
    if (this.context) {
      this.context.close();
      this.context = null;
    }
    this.isPlaying = false;
    this.currentTrack = null;
    console.log('Music stopped');
  }

  /**
   * Toggle between play and pause
   */
  togglePlayback() {
    if (!this.player) return;
    
    this.player.togglePause();
    // Update state based on actual player state
    const isActuallyPlaying = this.player.currentPlayingNode && !this.player.currentPlayingNode.paused;
    this.isPlaying = isActuallyPlaying;
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
    this.uiCallbacks = {
      onStateChange: null,
      onError: null,
      onTrackEnd: null
    };
  }

  /**
   * Initialize the music player with a specific implementation
   * @param {string} playerType - Type of player ('chiptune', etc.)
   * @returns {Promise<void>}
   */
  async initialize(playerType = 'chiptune') {
    switch (playerType) {
      case 'chiptune':
        this.player = new ChiptuneMusicPlayer();
        break;
      default:
        throw new Error(`Unknown player type: ${playerType}`);
    }

    // Set up callbacks
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

    await this.player.initialize();
  }

  /**
   * Load and play a music file
   * @param {string} url - URL to the music file
   * @param {string} title - Title of the track
   * @returns {Promise<void>}
   */
  async loadAndPlay(url, title) {
    if (!this.player) {
      await this.initialize();
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

// Export classes for testing or custom implementations
export { BaseMusicPlayer, ChiptuneMusicPlayer, MusicPlayerManager };
