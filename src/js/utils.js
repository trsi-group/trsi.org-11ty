/**
 * Modal, filter, sort and music-player-UI helpers.
 *
 * The selectors here are a contract with the Liquid templates. In particular:
 * - cards are `.card.pointer` and carry every field as a `data-*` attribute
 * - the modal reads `.card-content .title` / `.subtitle` straight off the card
 * - filter and sort operate on `#feed-wrapper .card-grid__item` wrappers
 */
import { musicPlayerManager } from './musicPlayer.js';

/**
 * @typedef {object} Credit
 * @property {string} name
 * @property {string} contribution
 */

/**
 * @typedef {object} CardData
 * @property {string | null} ctype
 * @property {string | null} type
 * @property {string} title
 * @property {string} subtitle
 * @property {string | null} slug
 * @property {string | null} description
 * @property {string | null} release_date
 * @property {Credit[]} credits
 * @property {string | null} card_image
 * @property {string | null} image
 * @property {string | null} asset
 * @property {string | null} download
 * @property {string | null} youtube
 * @property {string | null} demozoo
 * @property {string | null} csdb
 * @property {string | null} pouet
 * @property {string | null} format
 * @property {string | null} playerEmu
 * @property {string | null} kestra
 */

let scrollPosition = 0;

export function openModal() {
  scrollPosition = window.scrollY;
  document.body.style.top = `-${scrollPosition}px`;

  const modal = document.querySelector('.modal');
  if (!modal) return;

  modal.classList.add('is-active');
  document.body.classList.add('modal-open');
}

export function closeModal() {
  const modal = document.querySelector('.modal');
  if (!modal) return;

  modal.classList.remove('is-active');

  const iframe = modal.querySelector('iframe');
  if (iframe) {
    iframe.src = '';
  }

  musicPlayerManager.stop();

  document.body.classList.remove('modal-open');
  window.location.hash = '';
  document.body.style.top = '';
  window.scrollTo(0, scrollPosition);
}

/**
 * @param {HTMLElement} $card
 * @returns {CardData}
 */
export function getDataFromCard($card) {
  const text = (selector) => {
    const el = /** @type {HTMLElement | null} */ ($card.querySelector(selector));
    return el ? (el.innerText || el.textContent || '') : '';
  };

  // Music cards render an inline player instead of an <img>, so there may be no image.
  const img = /** @type {HTMLImageElement | null} */ ($card.querySelector('.card-image img'));

  return {
    ctype: $card.dataset.ctype || null,
    type: $card.dataset.type || null,
    title: text('.card-content .title'),
    subtitle: text('.card-content .subtitle'),
    slug: $card.dataset.slug || null,
    description: $card.dataset.description || null,
    release_date: $card.dataset.release_date || null,
    credits: $card.dataset.credits ? JSON.parse($card.dataset.credits) : [],
    card_image: img?.src || $card.dataset.image || null,
    image: $card.dataset.image || null,
    asset: $card.dataset.asset || null,
    download: $card.dataset.download || null,
    youtube: $card.dataset.youtube || null,
    demozoo: $card.dataset.demozoo || null,
    csdb: $card.dataset.csdb || null,
    pouet: $card.dataset.pouet || null,
    format: $card.dataset.format || null,
    playerEmu: $card.dataset.playeremu || null,
    kestra: $card.dataset.kestra || null,
  };
}

/**
 * @param {CardData} data
 */
export function populateModal(data) {
  const modalVideo = /** @type {HTMLIFrameElement | null} */ (document.getElementById('modal-video'));
  const modalImage = /** @type {HTMLImageElement | null} */ (document.getElementById('modal-image'));
  const musicPlayerOverlay = document.getElementById('music-player-overlay');
  if (!modalVideo || !modalImage || !musicPlayerOverlay) return;

  const figureVideo = /** @type {HTMLElement | null} */ (modalVideo.closest('figure.image'));
  const figureImage = /** @type {HTMLElement | null} */ (modalImage.closest('figure.image'));

  const showVideo = (visible) => {
    if (figureVideo) figureVideo.style.display = visible ? 'block' : 'none';
  };
  const showImage = (visible) => {
    if (figureImage) figureImage.style.display = visible ? 'block' : 'none';
  };

  // A production without a YouTube URL falls back to its card image rather than
  // rendering an empty iframe.
  if (data.ctype === 'prod' && data.youtube) {
    modalVideo.src = data.youtube;
    modalVideo.title = data.title;
    showVideo(true);
    showImage(false);
    musicPlayerOverlay.classList.add('is-hidden');
  } else if (data.ctype === 'music') {
    modalImage.src = data.image || data.card_image || '';
    modalImage.alt = data.title;
    showImage(true);
    showVideo(false);
    musicPlayerOverlay.classList.remove('is-hidden');
    setupMusicPlayerUI(data.asset, data.title, data.playerEmu);
  } else {
    modalImage.src = data.image || data.card_image || '';
    modalImage.alt = data.title;
    showImage(true);
    showVideo(false);
    musicPlayerOverlay.classList.add('is-hidden');
  }

  const buttonMap = {
    youtube: data.youtube,
    demozoo: data.demozoo,
    csdb: data.csdb,
    pouet: data.pouet,
    download: data.download,
    kestra: data.kestra,
  };

  const buttons = /** @type {NodeListOf<HTMLElement>} */ (
    document.querySelectorAll('#modal-overlay .button:not(#play-pause-btn)')
  );

  // Each button hides itself. Touching parentElement here would let the last
  // button decide the visibility of the whole row.
  buttons.forEach((button) => {
    const label = (button.innerText || button.textContent || '').toLowerCase().trim();
    const url = buttonMap[label];

    if (url) {
      button.style.display = '';
      button.onclick = () => window.open(url, '_blank', 'noopener');
    } else {
      button.style.display = 'none';
      button.onclick = null;
    }
  });

  setText('modal-description', data.description);
  setText('modal-credits', data.credits?.length ? formatCredits(data.credits) : '');
  setText('modal-release_date', data.release_date ? `Release Date: ${data.release_date}` : '');
}

/**
 * @param {string} id
 * @param {string | null} value
 */
function setText(id, value) {
  const el = /** @type {HTMLElement | null} */ (document.getElementById(id));
  if (!el) return;

  if (value) {
    el.innerText = value;
    el.style.display = '';
  } else {
    el.innerText = '';
    el.style.display = 'none';
  }
}

/**
 * Groups contributors by role: "Code: Alice, Bob\nMusic: Charlie".
 * @param {Credit[]} creditsArray
 * @returns {string}
 */
function formatCredits(creditsArray) {
  /** @type {Record<string, string[]>} */
  const grouped = {};

  creditsArray.forEach((person) => {
    const role = person.contribution;
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(person.name);
  });

  return Object.entries(grouped)
    .map(([role, names]) => `${role}: ${names.join(', ')}`)
    .join('\n');
}

export function handleFilterChange() {
  const cards = /** @type {NodeListOf<HTMLElement>} */ (
    document.querySelectorAll('#feed-wrapper .card-grid__item')
  );

  // The members page renders a sort control and no filters, so neither select
  // is guaranteed to exist.
  const typeFilter = /** @type {HTMLSelectElement | null} */ (document.getElementById('TypeFilter'));
  const platformFilter = /** @type {HTMLSelectElement | null} */ (document.getElementById('PlatformFilter'));

  const selectedType = typeFilter?.value ?? '';
  const selectedPlatform = platformFilter?.value ?? '';

  cards.forEach((card) => {
    const typeMatch = !selectedType || card.dataset.type === selectedType;
    const platformMatch = !selectedPlatform || card.dataset.platform === selectedPlatform;
    card.style.display = typeMatch && platformMatch ? '' : 'none';
  });
}

/** @type {Record<string, number>} */
const STATUS_RANK = {
  'active': 0,
  'inactive': 1,
  'in valhalla': 2,
  'lost in mission': 3,
};

/**
 * @param {Event} event
 */
export function handleSortChange(event) {
  const wrapper = document.querySelector('#feed-wrapper .card-grid');
  if (!wrapper) return;

  const cards = /** @type {HTMLElement[]} */ (
    Array.from(wrapper.querySelectorAll(':scope > .card-grid__item'))
  );
  const mode = /** @type {HTMLSelectElement} */ (event.target).value;

  const byHandle = (a, b) =>
    (a.dataset.sortHandle || '').localeCompare(b.dataset.sortHandle || '');

  const byStatus = (a, b) => {
    const ra = STATUS_RANK[a.dataset.status] ?? 99;
    const rb = STATUS_RANK[b.dataset.status] ?? 99;
    if (ra !== rb) return ra - rb;
    return byHandle(a, b);
  };

  cards.sort(mode === 'status' ? byStatus : byHandle);
  cards.forEach((card) => wrapper.appendChild(card));
}

/**
 * Wires the modal's play button to the player. The button is cloned first to
 * drop listeners from a previously opened card.
 * @param {string | null} downloadUrl
 * @param {string} title
 * @param {string | null} playerEmu
 */
export function setupMusicPlayerUI(downloadUrl, title, playerEmu) {
  if (!downloadUrl) return;

  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const pauseIcon = document.getElementById('pause-icon');

  if (!playPauseBtn || !playIcon || !pauseIcon || !playPauseBtn.parentNode) {
    console.error('Music player elements not found');
    return;
  }

  playIcon.classList.remove('is-hidden');
  pauseIcon.classList.add('is-hidden');

  const newPlayPauseBtn = /** @type {HTMLElement} */ (playPauseBtn.cloneNode(true));
  playPauseBtn.parentNode.replaceChild(newPlayPauseBtn, playPauseBtn);

  musicPlayerManager.onStateChange(updateMusicPlayerUI);
  musicPlayerManager.onError((error) => {
    console.error('Music player error:', error);
    resetMusicPlayerUI();
  });
  musicPlayerManager.onTrackEnd(resetMusicPlayerUI);

  newPlayPauseBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!musicPlayerManager.isPlaying() && !musicPlayerManager.getCurrentTrack()) {
      await musicPlayerManager.loadAndPlay(downloadUrl, title, playerEmu);
    } else {
      musicPlayerManager.togglePlayback();
    }
  });
}

export async function preloadMusicLibraries() {
  try {
    await musicPlayerManager.preload();
  } catch (error) {
    console.error('Failed to prepare music libraries:', error);
  }
}

/**
 * @param {boolean} isPlaying
 */
function updateMusicPlayerUI(isPlaying) {
  const playIcon = document.querySelector('#play-pause-btn #play-icon');
  const pauseIcon = document.querySelector('#play-pause-btn #pause-icon');
  if (!playIcon || !pauseIcon) return;

  playIcon.classList.toggle('is-hidden', isPlaying);
  pauseIcon.classList.toggle('is-hidden', !isPlaying);
}

function resetMusicPlayerUI() {
  updateMusicPlayerUI(false);
}
