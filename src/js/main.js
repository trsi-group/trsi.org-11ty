import { openModal, closeModal, populateModal, getDataFromCard, handleFilterChange } from './utils.js';

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
 * Runs automatically when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log("main.js: DOMContentLoaded");
  
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
  (document.querySelectorAll('.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button') || []).forEach(($close) => {
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
  const hashTitle = window.location.hash?.substring(1); // remove #
  const cardElement = document.querySelector(`[data-title="${hashTitle}"]`);
  if (cardElement) {
    const cardData = getDataFromCard(cardElement);
    populateModal(cardData);
    openModal();
  }
});