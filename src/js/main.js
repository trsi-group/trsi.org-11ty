import {
  openModal,
  closeModal,
  populateModal,
  getDataFromCard,
  handleFilterChange,
  handleSortChange,
  preloadMusicLibraries,
} from './utils.js';
import { initHeroSliders } from './heroSlider.js';
import { initMusicCards } from './cardMusicPlayer.js';

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;

  // The homepage now carries a Latest Music section, so the wasm players must be
  // warm there too or the first play stalls.
  if (path === '/' || path.startsWith('/music')) {
    preloadMusicLibraries();
  }

  /* Navbar burger */
  document.querySelectorAll('.navbar-burger').forEach((el) => {
    el.addEventListener('click', () => {
      const target = /** @type {HTMLElement} */ (el).dataset.target;
      const $target = target ? document.getElementById(target) : null;
      if (!$target) return;

      const open = el.classList.toggle('is-active');
      $target.classList.toggle('is-active', open);
      el.setAttribute('aria-expanded', String(open));
    });
  });

  /* Filters */
  ['TypeFilter', 'PlatformFilter'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', handleFilterChange);
  });

  /* Sort */
  document.getElementById('SortSelect')?.addEventListener('change', handleSortChange);

  /*
   * Clicking anywhere on a card opens its modal. The keyboard path is the
   * .card__open title button inside it, whose click bubbles up to here.
   */
  document.querySelectorAll('.card.pointer').forEach((cardElement) => {
    const card = /** @type {HTMLElement} */ (cardElement);

    card.addEventListener('click', () => {
      const cardData = getDataFromCard(card);
      populateModal(cardData);
      if (cardData.slug) window.location.hash = cardData.slug;
      openModal();
    });
  });

  document
    .querySelectorAll('.modal-background, .modal-close')
    .forEach(($close) => $close.addEventListener('click', () => closeModal()));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeModal();
  });

  /* Deep link: /#some-slug opens that card */
  const hashSlug = window.location.hash.substring(1);
  if (hashSlug) {
    const cardElement = /** @type {HTMLElement | null} */ (
      document.querySelector(`.card.pointer[data-slug="${CSS.escape(hashSlug)}"]`)
    );
    if (cardElement) {
      const cardData = getDataFromCard(cardElement);
      populateModal(cardData);
      openModal();
    }
  }

  initHeroSliders();
  initMusicCards();
});
