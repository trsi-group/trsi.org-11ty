/**
 * UI helpers for the card feeds and the music player.
 *
 * - handleFilterChange / handleSortChange: filter and reorder a card grid.
 * - setupMusicPlayerUI: bind a play/pause control to the MusicPlayerManager.
 * - enhanceSelects: replace native selects with the styled dropdown.
 */
import { musicPlayerManager } from './musicPlayer.js';

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
  const cards = document.querySelectorAll("#feed-wrapper .media-card");
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

const STATUS_RANK = {
  'awake': 0,
  'sleeping': 1,
  'lost in mission': 2,
  'in valhalla': 3,
};

export function handleSortChange(event) {
  const wrapper = document.querySelector('#feed-wrapper .card-grid');
  if (!wrapper) return;

  const cards = Array.from(wrapper.querySelectorAll(':scope > .media-card'));
  const mode = event.target.value;

  const byHandle = (a, b) =>
    (a.dataset.sortHandle || '').localeCompare(b.dataset.sortHandle || '');

  const byStatus = (a, b) => {
    const ra = STATUS_RANK[a.dataset.status] ?? 99;
    const rb = STATUS_RANK[b.dataset.status] ?? 99;
    if (ra !== rb) return ra - rb;
    return byHandle(a, b);
  };

  cards.sort(mode === 'status' ? byStatus : byHandle);
  cards.forEach(c => wrapper.appendChild(c));
}

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

function closeAllDropdowns(except) {
  document.querySelectorAll('.dropdown.is-open').forEach(dropdown => {
    if (dropdown === except) return;
    dropdown.classList.remove('is-open');
    dropdown.querySelector('.dropdown__trigger')?.setAttribute('aria-expanded', 'false');
  });
}

export function enhanceSelects() {
  document.querySelectorAll('.filter-select select').forEach(select => {
    const wrapper = select.closest('.filter-select');
    if (!wrapper || wrapper.classList.contains('dropdown')) return;
    wrapper.classList.add('dropdown');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'dropdown__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    const label = select.getAttribute('aria-label');
    if (label) trigger.setAttribute('aria-label', label);

    const value = document.createElement('span');
    value.className = 'dropdown__value';
    const caret = document.createElement('span');
    caret.className = 'dropdown__caret';
    caret.setAttribute('aria-hidden', 'true');
    trigger.append(value, caret);

    const menu = document.createElement('div');
    menu.className = 'dropdown__menu';
    menu.setAttribute('role', 'listbox');

    const options = Array.from(select.options).map(option => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'dropdown__option';
      item.setAttribute('role', 'option');
      item.dataset.value = option.value;
      item.textContent = option.textContent;
      menu.appendChild(item);
      return item;
    });

    const sync = () => {
      value.textContent = select.options[select.selectedIndex]?.textContent ?? '';
      options.forEach(item => item.setAttribute('aria-selected', String(item.dataset.value === select.value)));
    };

    const close = () => {
      wrapper.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const open = () => {
      closeAllDropdowns(wrapper);
      wrapper.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    };

    trigger.addEventListener('click', () => {
      wrapper.classList.contains('is-open') ? close() : open();
    });

    trigger.addEventListener('keydown', event => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      open();
      const current = options.findIndex(item => item.dataset.value === select.value);
      const next = event.key === 'ArrowDown'
        ? Math.min(current + 1, options.length - 1)
        : Math.max(current - 1, 0);
      options[next]?.focus();
    });

    options.forEach(item => {
      item.addEventListener('click', () => {
        select.value = item.dataset.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        sync();
        close();
        trigger.focus();
      });
    });

    menu.addEventListener('keydown', event => {
      const index = options.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
        trigger.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        options[Math.min(index + 1, options.length - 1)]?.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (index <= 0) trigger.focus();
        else options[index - 1].focus();
      }
    });

    select.addEventListener('change', sync);
    wrapper.append(trigger, menu);
    sync();
  });

  if (document.body.dataset.dropdownsBound) return;
  document.body.dataset.dropdownsBound = 'true';
  document.addEventListener('click', event => {
    if (event.target.closest('.dropdown')) return;
    closeAllDropdowns();
  });
}
