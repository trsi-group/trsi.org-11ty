import { openModal, closeModal, populateModal, getDataFromCard, handleFilterChange, stopMusicPlayer, preloadMusicLibraries } from './utils.js';

/**
 * Initializes UI event handlers after DOM content is loaded.
 *
 * Features:
 * 1. Navbar Toggle:
 *    - Registers click events on '.navbar-burger' elements to toggle mobile menu visibility.
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
 *    - Pre-loads libopenmpt and chiptune2.js libraries in the background for instant music playback.
 *
 * Runs automatically when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("main.js: DOMContentLoaded");
  
  // Pre-load music libraries in the background for instant playback
  preloadMusicLibraries();
  
  /* Navbar Menu */
  const $navbarBurgers = Array.prototype.slice.call(document.querySelectorAll('.navbar-burger'), 0);
  $navbarBurgers.forEach( el => {
    el.addEventListener('click', () => {
      const target = el.dataset.target;
      const $target = document.getElementById(target);
      el.classList.toggle('is-active');
      $target.classList.toggle('is-active');
    });
  });

  /* Filter Components */
  ["TypeFilter", "PlatformFilter"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", handleFilterChange);
    }
  });

  /* Modal Dialog */
  (document.querySelectorAll('.js-modal-trigger') || []).forEach(($trigger) => {
    $trigger.addEventListener('click', (event) => {
      const clickedButton = event.currentTarget;
      const cardElement = clickedButton.closest('.card');
      const cardData = getDataFromCard(cardElement);
      populateModal(cardData);
      window.location.hash = cardData.slug;
      openModal();
    });
  });

  // Add a click event on various child elements to close the parent modal
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button:not(.music-player-button)') || []).forEach(($close) => {
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

  // WOTW mode for testing Music integration
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  if (mode && mode == 'wotw') {
    const navItems = document.querySelectorAll('.navbar-start .navbar-item');
    navItems.forEach(item => {
      if (item.innerText.trim() === 'Music') {
        item.style.display = 'flex';
      }
    });
  }
});