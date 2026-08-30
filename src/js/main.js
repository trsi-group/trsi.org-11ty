import { handleFilterChange, handleSortChange, preloadMusicLibraries, restoreFiltersFromQuery, setupMusicPlayerUI, setLoadProgress, enhanceSelects } from './utils.js';
import { installWasmProgress } from './wasmProgress.js';
import { configureAudioSession } from './audioContext.js';

/**
 * Initializes UI event handlers after DOM content is loaded.
 *
 * Features:
 * 1. Nav Toggle:
 *    - Toggles the mobile nav panel via '#nav-toggle', closing on link click or Escape.
 *
 * 2. Filter Components:
 *    - Restores filters from the query string, then registers 'change' events on
 *      #TypeFilter and #PlatformFilter to filter cards and mirror the selection back.
 *
 * 3. Music Player:
 *    - Binds the play/pause control on a track page to the MusicPlayerManager.
 *
 * 4. Music Library Pre-loading:
 *    - Pre-loads music player libraries in the background for instant music playback.
 *
 * Runs automatically when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("main.js: DOMContentLoaded");
  
  if (window.location.pathname.startsWith('/music')) {
    // Declared before anything creates a context, so iOS never files this page
    // under the ambient session the ringer switch silences.
    configureAudioSession();
    // The backend module is a couple of megabytes; the play button's ring shows
    // how much of it has arrived.
    installWasmProgress(setLoadProgress);
    preloadMusicLibraries();
  }
  
  /* Nav */
  const navToggle = document.getElementById('nav-toggle');
  const navList = document.getElementById('nav-list');
  if (navToggle && navList) {
    const closeNav = () => {
      navList.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.documentElement.style.overflow = '';
    };

    navToggle.addEventListener('click', () => {
      const isOpen = navList.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      document.documentElement.style.overflow = isOpen ? 'hidden' : '';
    });

    navList.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && navList.classList.contains('is-open')) {
        closeNav();
      }
    });
  }

  /* Hero banner rotation */
  const heroFrames = document.querySelectorAll('.hero__bg');
  if (heroFrames.length > 1 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const HOLD_MS = 7000;
    let current = 0;
    let timer = null;

    const advance = () => {
      heroFrames[current].classList.remove('is-active');
      current = (current + 1) % heroFrames.length;
      heroFrames[current].classList.add('is-active');
    };

    const start = () => { if (!timer) timer = setInterval(advance, HOLD_MS); };
    const stop = () => { clearInterval(timer); timer = null; };

    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });
    start();
  }

  /* NFO art is fixed-width and overruns a phone screen, so the markup ships it
     collapsed and it only opens itself where there is room. */
  const nfo = document.querySelector('.item__nfo');
  if (nfo && window.matchMedia('(min-width: 861px)').matches) {
    nfo.open = true;
  }

  /* Music player on a track page — the overlay carries the track it belongs to */
  const musicOverlay = document.getElementById('music-player-overlay');
  if (musicOverlay?.dataset.asset) {
    setupMusicPlayerUI(musicOverlay.dataset.asset, musicOverlay.dataset.title, musicOverlay.dataset.playeremu);
  }

  /* Restore any filter carried in the query string before the styled dropdown
     is built, so it renders with the right label already selected. */
  restoreFiltersFromQuery();

  enhanceSelects();

  /* Filter Components */
  ["TypeFilter", "PlatformFilter"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", handleFilterChange);
    }
  });

  /* Filter reset — only shown once a filter is actually set */
  const filterReset = document.getElementById('filter-reset');
  const filterSelects = ["TypeFilter", "PlatformFilter"]
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if (filterReset && filterSelects.length) {
    const syncReset = () => {
      filterReset.hidden = !filterSelects.some(el => el.value);
    };

    filterSelects.forEach(el => el.addEventListener("change", syncReset));

    filterReset.addEventListener("click", () => {
      filterSelects.forEach(el => {
        if (!el.value) return;
        el.value = "";
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
      syncReset();
    });

    syncReset();
  }

  /* Sort Component */
  const sortSelect = document.getElementById("SortSelect");
  if (sortSelect) sortSelect.addEventListener("change", handleSortChange);

});