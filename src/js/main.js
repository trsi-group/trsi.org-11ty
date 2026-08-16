import { openModal, closeModal, populateModal, getDataFromCard, handleFilterChange, handleSortChange, preloadMusicLibraries, enhanceSelects } from './utils.js';

/**
 * Initializes UI event handlers after DOM content is loaded.
 *
 * Features:
 * 1. Nav Toggle:
 *    - Toggles the mobile nav panel via '#nav-toggle', closing on link click or Escape.
 *
 * 2. Filter Components:
 *    - Registers 'change' events on #TypeFilter and #PlatformFilter dropdowns to dynamically filter card elements.
 *
 * 3. Modal Handling:
 *    - Registers click events on '.js-modal-trigger' buttons to open modals with dynamically injected card data.
 *    - Registers click events on modal close elements to close individual modals.
 *    - Registers 'Escape' key event to close all active modals.
 *
 * 4. Music Library Pre-loading:
 *    - Pre-loads music player libraries in the background for instant music playback.
 *
 * Runs automatically when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("main.js: DOMContentLoaded");
  
  if (window.location.pathname.startsWith('/music')) {
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
      if (document.body.classList.contains('modal-open')) {
        closeModal();
        return;
      }
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

  /* Modal Dialog — whole card is clickable */
  (document.querySelectorAll('.pointer[data-ctype]') || []).forEach((cardElement) => {
    cardElement.addEventListener('click', () => {
      const cardData = getDataFromCard(cardElement);
      populateModal(cardData);
      window.location.hash = cardData.slug;
      openModal();
    });
  });

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close') || []).forEach(($close) => {
    $close.addEventListener('click', () => {
      closeModal();
    });
  });

  // Add a keyboard event to close all modals
  document.addEventListener('keydown', (event) => {
    if(event.key === "Escape") {
      closeModal();
    }
  });

  // open modal if items specified in #
  const hashSlug = window.location.hash?.substring(1); // remove #
  const cardElement = document.querySelector(`[data-slug="${hashSlug}"]`);
  if (cardElement) {
    const cardData = getDataFromCard(cardElement);
    populateModal(cardData);
    openModal();
  }

});