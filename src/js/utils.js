/**
 * Utility functions to manage Bulma modals.
 *
 * - openModal($el): Activates a specific modal by adding the 'is-active' class.
 * - closeModal($el): Deactivates a specific modal by removing the 'is-active' class.
 *
 * @param {Element} $el - The modal DOM element to open or close.
 */
import { musicPlayerManager } from './musicPlayer.js';

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
  musicPlayerManager.stop();
  
  document.body.classList.remove('modal-open');
  // Remove hash title from URL
  window.location.hash = '';
  // Restore scroll position
  document.body.style.top = '';
  window.scrollTo(0, scrollPosition);
}

/**
 * Extracts data attributes and content from a card DOM element.
 *
 * This function retrieves both data attributes and content from various child elements
 * of a card component, returning a structured object with all relevant information
 * needed for modal population or other operations.
 *
 * @param {Element} $card - The card DOM element to extract data from.
 * @returns {Object} Object containing extracted data:
 *   - ctype: Content type from CMS
 *   - type: sub-type of content e.g. track music in music
 *   - title: Text content from .card-content .title element
 *   - subtitle: Text content from .card-content .subtitle element  
 *   - slug: data-slug attribute value
 *   - description: data-description attribute value
 *   - release_date: data-release_date attribute value
 *   - credits: Parsed JSON from data-credits attribute, or empty array
 *   - card_image: Image src from .card-image img element
 *   - image: data-image attribute value
 *   - download: data-download attribute value
 *   - youtube: data-youtube attribute value
 *   - demozoo: data-demozoo attribute value
 *   - csdb: data-csdb attribute value
 *   - pouet: data-pouet attribute value
 *   - format: data-format attribute value
 */
export function getDataFromCard($card) {
  const data = {
    ctype: $card.dataset.ctype || null,
    type: $card.dataset.type || null,
    title: $card.querySelector('.card-content .title')?.innerText || $card.querySelector('.card-content .title')?.textContent,
    slug: $card.dataset.slug || null,
    description: $card.dataset.description || null,
    release_date: $card.dataset.release_date || null,
    subtitle: $card.querySelector('.card-content .subtitle')?.innerText || $card.querySelector('.card-content .subtitle')?.textContent,
    credits: $card.dataset.credits ? JSON.parse($card.dataset.credits) : [],
    card_image: $card.querySelector('.card-image img').src,
    image: $card.dataset.image || null,
    assetId: $card.dataset.assetId || null,
    asset: $card.dataset.asset || null,
    download: $card.dataset.download || null,
    youtube: $card.dataset.youtube || null,
    demozoo: $card.dataset.demozoo || null,
    csdb: $card.dataset.csdb || null,
    pouet: $card.dataset.pouet || null,
    format: $card.dataset.format || null,
    playerEmu: $card.dataset.playeremu || null,
    kestra: $card.dataset.kestra || null
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
  
  if (data.ctype == 'prod') {
    modalVideo.src = data.youtube;
    modalVideo.alt = data.title;
    figureVideo.style.display = 'block';
    figureImage.style.display = 'none';
    musicPlayerOverlay.classList.add('is-hidden');
  } else  if (data.ctype == 'graphic' || data.ctype == 'member') {
    modalImage.src = data.image;
    modalImage.alt = data.title;
    figureImage.style.display = 'block';
    figureVideo.style.display = 'none';
    musicPlayerOverlay.classList.add('is-hidden');
  } else  if (data.ctype == 'music') {
    modalImage.src = data.card_image; // needs to be replaced in case we get an original image for a track
    modalImage.alt = data.title;
    figureImage.style.display = 'block';
    figureVideo.style.display = 'none';
    musicPlayerOverlay.classList.remove('is-hidden');
    setupMusicPlayerUI(data.asset, data.title, data.playerEmu);
  }

  const buttons = document.querySelectorAll('#modal-overlay .button:not(#play-pause-btn)');

  buttons.forEach(button => {
    const text = (button.innerText || button.textContent || '').toLowerCase();

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
    } else if (text === 'kestra' && data.kestra) {
      button.style.display = 'flex';
      button.onclick = () => window.open(data.kestra, '_blank');
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

/**
 * Sets up the music player UI controls and connects them to the music player manager.
 * 
 * @param {string} downloadUrl - URL to the music file
 * @param {string} title - Title of the music track
 */
export function setupMusicPlayerUI(downloadUrl, title, playerEmu) {
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
  
  // Set up UI callbacks for the music player
  musicPlayerManager.onStateChange((isPlaying) => {
    updateMusicPlayerUI(isPlaying);
  });
  
  musicPlayerManager.onError((error) => {
    console.error('Music player error:', error);
    resetMusicPlayerUI();
  });
  
  musicPlayerManager.onTrackEnd(() => {
    resetMusicPlayerUI();
  });
  
  // Add click event listener to the new button
  newPlayPauseBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!musicPlayerManager.isPlaying() && !musicPlayerManager.getCurrentTrack()) {
      // Load and play new track
      await musicPlayerManager.loadAndPlay(downloadUrl, title, playerEmu);
    } else {
      // Toggle playback
      musicPlayerManager.togglePlayback();
    }
  });
}

/**
 * Pre-loads music player libraries for faster playback.
 */
export async function preloadMusicLibraries() {
  try {
    await musicPlayerManager.preload();
  } catch (error) {
    console.error('Failed to prepare music libraries:', error);
  }
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
