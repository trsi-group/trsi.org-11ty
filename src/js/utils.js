/**
 * UI helpers for the card feeds and the music player.
 *
 * - handleFilterChange / handleSortChange: filter and reorder a card grid.
 * - setupMusicPlayerUI: bind a play/pause control to the MusicPlayerManager.
 * - enhanceSelects: replace native selects with the styled dropdown.
 */
import { musicPlayerManager } from './musicPlayer.js';

/**
 * The two dropdowns that narrow a card grid, and the query parameter each one
 * is mirrored into.
 */
const FILTERS = [
  { id: 'TypeFilter', param: 'type', key: 'type' },
  { id: 'PlatformFilter', param: 'platform', key: 'platform' },
];

/**
 * Shows only the cards in #feed-wrapper matching every active dropdown.
 * An empty dropdown matches everything, so the two combine with AND.
 */
function applyFilters() {
  const active = FILTERS
    .map(filter => ({ key: filter.key, value: document.getElementById(filter.id)?.value || '' }))
    .filter(filter => filter.value);

  document.querySelectorAll('#feed-wrapper .media-card').forEach(card => {
    const matches = active.every(filter => card.dataset[filter.key] === filter.value);
    card.style.display = matches ? '' : 'none';
  });
}

/**
 * Mirrors the selections into the query string. Cards are links now, so the
 * grid is left behind on every click — this is what lets the back button
 * return to the filtered view, and makes a filtered grid shareable.
 */
function syncFilterQuery() {
  const url = new URL(window.location.href);

  FILTERS.forEach(filter => {
    const value = document.getElementById(filter.id)?.value || '';
    if (value) {
      url.searchParams.set(filter.param, value);
    } else {
      url.searchParams.delete(filter.param);
    }
  });

  window.history.replaceState(null, '', url);
}

/**
 * Handles a change on either dropdown.
 */
export function handleFilterChange() {
  applyFilters();
  syncFilterQuery();
}

/**
 * Reapplies the filters named in the query string. Call before enhanceSelects
 * so the styled dropdown picks up the restored value as its initial label.
 */
export function restoreFiltersFromQuery() {
  const params = new URLSearchParams(window.location.search);
  let restored = false;

  FILTERS.forEach(filter => {
    const select = document.getElementById(filter.id);
    const value = params.get(filter.param);
    if (!select || !value) return;
    // Ignore anything the dropdown does not actually offer
    if (!Array.from(select.options).some(option => option.value === value)) return;
    select.value = value;
    restored = true;
  });

  if (restored) applyFilters();
}

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
