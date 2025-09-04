/**
 * Utility functions to manage Bulma modals.
 *
 * - openModal($el): Activates a specific modal by adding the 'is-active' class.
 * - closeModal($el): Deactivates a specific modal by removing the 'is-active' class.
 *
 * @param {Element} $el - The modal DOM element to open or close.
 */
let scrollPosition = 0;

export function openModal() {
  // Store scroll position
  scrollPosition = window.scrollY;
  document.body.style.top = `-${scrollPosition}px`;
  
  const modal = document.querySelector('.modal');
  modal.classList.add('is-active');
  document.body.classList.add('modal-open');
}

export function closeModal() {
  const modal = document.querySelector('.modal');
  modal.classList.remove('is-active');
  // Stop YouTube video if present
  const iframe = modal.querySelector('iframe');
  if (iframe) {
    iframe.src = '';
  }
  
  // Stop music player if present
  stopMusicPlayer();
  
  document.body.classList.remove('modal-open');
  // Remove hash title from URL
  window.location.hash = '';
  // Restore scroll position
  document.body.style.top = '';
  window.scrollTo(0, scrollPosition);
}
// write me a funtion doc similar to existings 
export function getDataFromCard($card) {
  const data = {
    title: $card.querySelector('.card-content .title')?.innerText,
    slug: $card.dataset.slug || null,
    description: $card.dataset.description || null,
    release_date: $card.dataset.release_date || null,
    subtitle: $card.querySelector('.card-content .subtitle')?.innerText,
    credits: $card.dataset.credits ? JSON.parse($card.dataset.credits) : [],
    card_image: $card.querySelector('.card-image img').src,
    image: $card.dataset.image || null,
    download: $card.dataset.download || null,
    youtube: $card.dataset.youtube || null,
    demozoo: $card.dataset.demozoo || null,
    csdb: $card.dataset.csdb || null,
    pouet: $card.dataset.pouet || null,
    format: $card.dataset.format || null
  };
  return data;
}

/**
 * Populates the modal with dynamic content based on provided data.
 *
 * This function:
 * - Displays either a YouTube video (`iframe`) or an image in the modal, depending on availability.
 * - Dynamically configures action buttons (YouTube, Demozoo, Pouet, Download) based on provided URLs.
 * - Injects description text and formatted credits if available.
 * - Hides elements gracefully when corresponding data is missing.
 *
 * @param {Object} data - The content data to populate the modal.
 *
 * Note:
 * - Buttons are hidden if their corresponding data is not provided.
 * - Assumes presence of modal elements with IDs:
 *   - #modal-video, #modal-image, #modal-description, #modal-credits, and buttons inside #modal-overlay.
 */
export function populateModal(data) {
  const modalVideo = document.getElementById('modal-video');
  const figureVideo = modalVideo.closest('figure.image');
  const modalImage = document.getElementById('modal-image');
  const figureImage = modalImage.closest('figure.image');
  const musicPlayerOverlay = document.getElementById('music-player-overlay');
  
  if (data.youtube) {
    modalVideo.src = data.youtube;
    modalVideo.alt = data.title;
    figureVideo.style.display = 'block';
    figureImage.style.display = 'none';
    musicPlayerOverlay.classList.add('is-hidden');
  } else {
    modalImage.src = data.image;
    modalImage.alt = data.title;
    figureImage.style.display = 'block';
    figureVideo.style.display = 'none';
    
    // Show music player overlay for tracked music
    if (data.format === 'Tracked Music' && data.download) {
      musicPlayerOverlay.classList.remove('is-hidden');
      setupMusicPlayer(data.download, data.title);
    } else {
      musicPlayerOverlay.classList.add('is-hidden');
    }
  }

  const buttons = document.querySelectorAll('#modal-overlay .button:not(#play-pause-btn)');

  buttons.forEach(button => {
    const text = button.innerText.toLowerCase();

    if (text === 'youtube' && data.youtube) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.youtube, '_blank');
    } else if (text === 'demozoo' && data.demozoo) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.demozoo, '_blank');
    } else if (text === 'csdb' && data.csdb) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.csdb, '_blank');
    } else if (text === 'pouet' && data.pouet) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.pouet, '_blank');
    } else if (text === 'download' && data.download) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.download, '_blank');
    } else {
      button.parentElement.style.display = 'none';
      button.style.display = 'none';
    }
  });

  const description = document.getElementById('modal-description');
  if (data.description) {
    description.innerText = data.description;
  } else {
    description.style.display = 'none';
  }

  const credits = document.getElementById('modal-credits');
  if (data.credits) {
    credits.innerText = formatCredits(data.credits);
  } else {
    credits.style.display = 'none';
  }

  const release_date = document.getElementById('modal-release_date');
  if (data.release_date) {
    release_date.innerText = `Release Date: ${data.release_date}`;
  } else {
    release_date.style.display = 'none';
  }
}

/**
 * Formats an array of credit entries into a readable string grouped by contribution type.
 *
 * This function:
 * - Groups contributors by their `contribution` role.
 * - Outputs a string where each line lists a role followed by contributor names.
 * - Example output:
 *     Code: Alice, Bob
 *     Music: Charlie
 *
 * @param {Array<Object>} creditsArray - Array of credit objects.
 * @param {string} creditsArray[].name - Contributor's name.
 * @param {string} creditsArray[].contribution - Type of contribution (e.g., "Code", "Music").
 *
 * @returns {string} A formatted string grouping contributors by role.
 *
 * Note:
 * - Removes any trailing newline at the end of the string.
 */
function formatCredits(creditsArray) {
  // Group contributors by contribution type
  const grouped = {};

  creditsArray.forEach(person => {
    const role = person.contribution;
    if (!grouped[role]) {
      grouped[role] = [];
    }
    grouped[role].push(person.name);
  });

  // Build the formatted string
  let formatted = '';
  for (const role in grouped) {
    formatted += `${role}: ${grouped[role].join(', ')}\n`;
  }
  return formatted.trim();  // Remove trailing newline
}

/**
 * Handles filtering of cards based on selected type and platform filters.
 *
 * This function listens to changes in the filter dropdowns (#TypeFilter and #PlatformFilter)
 * and dynamically shows or hides cards within the #feed-wrapper based on matching 
 * data attributes (`data-type` and `data-platform`).
 *
 * @param {Event} event - The change event triggered by the filter dropdowns.
 *
 * Behavior:
 * - If no filter is selected, all cards are shown.
 * - If one or both filters are selected, only cards matching the selected criteria are displayed.
 * - Cards that don't match the filter criteria are hidden via `display: none`.
 */
export function handleFilterChange(event) {
  const cards = document.querySelectorAll("#feed-wrapper .column");
  const typeFilter = document.getElementById("TypeFilter");
  const platformFilter = document.getElementById("PlatformFilter");

  const selectedType = typeFilter.value;
  const selectedPlatform = platformFilter.value;
  
  cards.forEach(card => {
    const typeMatch = !selectedType || card.dataset.type === selectedType;
    const platformMatch = !selectedPlatform || card.dataset.platform === selectedPlatform;
    const matches = typeMatch && platformMatch;
    card.style.display = matches ? '' : 'none';
  })
};

// Global music player variables
let currentMusicPlayer = null;
let libopenmptLoaded = false;

/**
 * Initializes the music player for tracked music files (MOD, XM, S3M, IT, etc.)
 * using chiptune2.js library.
 * 
 * @param {string} downloadUrl - URL to the music file
 * @param {string} title - Title of the music track
 */
export function setupMusicPlayer(downloadUrl, title) {
  if (!downloadUrl) return;
  
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');
  
  if (!playPauseBtn || !playIcon || !pauseIcon) {
    console.error('Music player elements not found');
    return;
  }
  
  // Reset button state and ensure it's visible
  playIcon.classList.remove('is-hidden');
  pauseIcon.classList.add('is-hidden');
  
  // Remove any existing event listeners by cloning the button
  const newPlayPauseBtn = playPauseBtn.cloneNode(true);
  playPauseBtn.parentNode.replaceChild(newPlayPauseBtn, playPauseBtn);
  
  // Get references to the new cloned elements
  const newPlayIcon = newPlayPauseBtn.querySelector('#play-icon');
  const newPauseIcon = newPlayPauseBtn.querySelector('#pause-icon');
  
  // Add click event listener to the new button
  newPlayPauseBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!currentMusicPlayer) {
      loadAndPlayMusic(downloadUrl, title);
    } else {
      toggleMusicPlayback();
    }
  });
}

/**
 * Loads the libopenmpt library and initializes the music player.
 * This function ensures the library is only loaded once.
 */
async function loadLibopenmpt() {
  if (libopenmptLoaded) return;
  
  return new Promise((resolve, reject) => {
    // Set up Module configuration before loading
    if (typeof window.Module === 'undefined') {
      window.Module = {};
    }
    
    // Configure locateFile to find the memory file
    window.Module.locateFile = function(path) {
      console.log('locateFile called with path:', path);
      if (path === 'libopenmpt.js.mem') {
        return '/js/libopenmpt.js.mem';
      }
      return '/js/' + path;
    };
    
    // Set up initialization callback
    const originalOnRuntimeInitialized = window.Module.onRuntimeInitialized;
    window.Module.onRuntimeInitialized = function() {
      console.log('Module runtime initialized');
      if (typeof originalOnRuntimeInitialized === 'function') {
        originalOnRuntimeInitialized();
      }
      window.libopenmpt = window.Module;
      libopenmptLoaded = true;
      resolve();
    };
    
    // Load libopenmpt.js
    const script = document.createElement('script');
    script.src = '/js/libopenmpt.js';
    script.onload = () => {
      console.log('libopenmpt.js script loaded, waiting for initialization...');
      // Add a timeout in case onRuntimeInitialized doesn't fire
      setTimeout(() => {
        if (!libopenmptLoaded) {
          console.log('Timeout waiting for onRuntimeInitialized, checking Module directly...');
          if (typeof window.Module !== 'undefined' && window.Module._openmpt_module_create_from_memory) {
            console.log('Module appears ready, proceeding...');
            window.libopenmpt = window.Module;
            libopenmptLoaded = true;
            resolve();
          } else {
            reject(new Error('libopenmpt failed to initialize within timeout'));
          }
        }
      }, 5000); // 5 second timeout
    };
    script.onerror = (error) => {
      console.error('Failed to load libopenmpt.js:', error);
      reject(error);
    };
    document.head.appendChild(script);
  });
}

/**
 * Loads and plays a music file using chiptune2.js
 * 
 * @param {string} url - URL to the music file
 * @param {string} title - Title of the music track
 */
async function loadAndPlayMusic(url, title) {
  try {
    console.log('Loading music:', title, 'from:', url);
    
    // Stop any currently playing music
    stopMusicPlayer();
    
    // Load libopenmpt if not already loaded
    await loadLibopenmpt();
    console.log('libopenmpt loaded successfully');
    
    // Load chiptune2.js
    if (typeof ChiptuneJsPlayer === 'undefined') {
      await loadScript('/js/chiptune2.js');
      console.log('chiptune2.js loaded successfully');
    }
    
    // Verify libopenmpt is available
    if (typeof window.libopenmpt === 'undefined') {
      throw new Error('libopenmpt is not available');
    }
    
    // Create player instance
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const config = new ChiptuneJsConfig(0, 100, 8, context); // 0 = no repeat
    
    currentMusicPlayer = new ChiptuneJsPlayer(config);
    
    // Set up event handlers
    currentMusicPlayer.onError((error) => {
      console.error('Music player error:', error);
      resetMusicPlayerUI();
    });
    
    currentMusicPlayer.onEnded(() => {
      console.log('Music playback ended');
      resetMusicPlayerUI();
    });
    
    // Load and play the music file
    currentMusicPlayer.load(url, (buffer) => {
      console.log('Music file loaded, starting playback');
      currentMusicPlayer.play(buffer);
      updateMusicPlayerUI(true);
    });
    
  } catch (error) {
    console.error('Failed to load or play music:', error);
    resetMusicPlayerUI();
    alert('Failed to load music player. Please check the console for details.');
  }
}

/**
 * Toggles music playback (play/pause)
 */
function toggleMusicPlayback() {
  if (!currentMusicPlayer) return;
  
  currentMusicPlayer.togglePause();
  // Update UI based on current state
  const isPlaying = currentMusicPlayer.currentPlayingNode && !currentMusicPlayer.currentPlayingNode.paused;
  updateMusicPlayerUI(isPlaying);
}

/**
 * Stops the current music player and cleans up resources
 */
export function stopMusicPlayer() {
  if (currentMusicPlayer) {
    currentMusicPlayer.stop();
    currentMusicPlayer = null;
  }
  resetMusicPlayerUI();
}

/**
 * Updates the music player UI to show play/pause state
 * 
 * @param {boolean} isPlaying - Whether music is currently playing
 */
function updateMusicPlayerUI(isPlaying) {
  const playIcon = document.querySelector('#play-pause-btn #play-icon');
  const pauseIcon = document.querySelector('#play-pause-btn #pause-icon');
  
  if (!playIcon || !pauseIcon) {
    console.error('Play/pause icons not found');
    return;
  }
  
  if (isPlaying) {
    playIcon.classList.add('is-hidden');
    pauseIcon.classList.remove('is-hidden');
  } else {
    playIcon.classList.remove('is-hidden');
    pauseIcon.classList.add('is-hidden');
  }
}

/**
 * Resets the music player UI to initial state
 */
function resetMusicPlayerUI() {
  const playIcon = document.querySelector('#play-pause-btn #play-icon');
  const pauseIcon = document.querySelector('#play-pause-btn #pause-icon');
  
  if (playIcon && pauseIcon) {
    playIcon.classList.remove('is-hidden');
    pauseIcon.classList.add('is-hidden');
  }
}

/**
 * Utility function to load a script dynamically
 * 
 * @param {string} src - Script source URL
 * @returns {Promise} Promise that resolves when script is loaded
 */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}
