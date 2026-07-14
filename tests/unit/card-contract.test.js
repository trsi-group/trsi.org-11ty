import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/js/musicPlayer.js', () => ({
  musicPlayerManager: {
    stop: vi.fn(),
    isPlaying: vi.fn(() => false),
    getCurrentTrack: vi.fn(() => null),
    loadAndPlay: vi.fn(),
    togglePlayback: vi.fn(),
    onStateChange: vi.fn(),
    onError: vi.fn(),
    onTrackEnd: vi.fn(),
    preload: vi.fn(),
  },
}));

const { getDataFromCard, populateModal } = await import('../../src/js/utils.js');

const productionCard = () => {
  document.body.innerHTML = `
    <article class="card pointer"
      data-ctype="prod"
      data-slug="all-roads-lead-to-romaexe"
      data-youtube="https://www.youtube-nocookie.com/embed/abc12345678"
      data-demozoo="https://demozoo.org/productions/1/"
      data-release_date="2026-04-05"
      data-credits='[{"name":"Madison","contribution":"Code"},{"name":"Elko","contribution":"Graphics"}]'>
      <div class="card-image"><img src="/img/card/roma.webp"></div>
      <div class="card-content">
        <p class="card__date"><time datetime="2026-04-05">APRIL 5, 2026</time></p>
        <button class="title card__open">All roads lead to ROMA.EXE</button>
        <p class="subtitle">Amiga OCS – Demo</p>
      </div>
    </article>`;
  return /** @type {HTMLElement} */ (document.querySelector('.card'));
};

const modal = () => {
  const host = document.createElement('div');
  host.innerHTML = `
    <div id="modal-overlay" class="modal">
      <figure class="image is-16by9"><iframe id="modal-video" src=""></iframe></figure>
      <figure class="image">
        <img id="modal-image" src="" alt="">
        <div id="music-player-overlay" class="is-hidden">
          <button id="play-pause-btn"><span id="play-icon"></span><span id="pause-icon"></span></button>
        </div>
      </figure>
      <p id="modal-description"></p>
      <p id="modal-credits"></p>
      <p id="modal-release_date"></p>
      <div class="modal-actions">
        <button class="button">Demozoo</button>
        <button class="button">CSDB</button>
        <button class="button">Pouet</button>
        <button class="button">Download</button>
        <button class="button">Kestra</button>
      </div>
    </div>`;
  document.body.appendChild(host);
};

describe('getDataFromCard', () => {
  it('reads the card meta from the new below-image block', () => {
    const data = getDataFromCard(productionCard());

    expect(data.ctype).toBe('prod');
    expect(data.slug).toBe('all-roads-lead-to-romaexe');
    expect(data.title).toBe('All roads lead to ROMA.EXE');
    expect(data.subtitle).toBe('Amiga OCS – Demo');
    expect(data.credits).toHaveLength(2);
    expect(data.credits[0].name).toBe('Madison');
  });

  it('preserves the non-standard data-release_date and data-playeremu casing', () => {
    // Renaming either attribute silently breaks the modal.
    expect(getDataFromCard(productionCard()).release_date).toBe('2026-04-05');

    document.body.innerHTML = `
      <article class="card pointer" data-ctype="music" data-playeremu="UADE" data-asset="/tracks/x.mod">
        <div class="card-content"><button class="title">T</button><p class="subtitle">S</p></div>
      </article>`;
    const data = getDataFromCard(/** @type {HTMLElement} */ (document.querySelector('.card')));
    expect(data.playerEmu).toBe('UADE');
  });

  it('does not throw on a music card that renders a player instead of an image', () => {
    document.body.innerHTML = `
      <article class="card pointer" data-ctype="music" data-image="/img/music-player.webp">
        <div class="card-image"><div class="music-card"></div></div>
        <div class="card-content"><button class="title">Samsara</button><p class="subtitle">Amiga – Tracked Music</p></div>
      </article>`;
    const card = /** @type {HTMLElement} */ (document.querySelector('.card'));

    expect(() => getDataFromCard(card)).not.toThrow();
    expect(getDataFromCard(card).card_image).toBe('/img/music-player.webp');
  });
});

describe('populateModal action buttons', () => {
  it('hides only the buttons without a URL, not the whole row', () => {
    // All five buttons share a parent. Toggling parentElement made the last
    // button (Kestra) decide the visibility of every other button.
    const card = productionCard();
    modal();
    populateModal(getDataFromCard(card));

    const byLabel = Object.fromEntries(
      Array.from(document.querySelectorAll('.modal-actions .button')).map((b) => [
        b.textContent.trim().toLowerCase(),
        /** @type {HTMLElement} */ (b),
      ]),
    );

    expect(byLabel.demozoo.style.display).not.toBe('none');
    expect(byLabel.csdb.style.display).toBe('none');
    expect(byLabel.kestra.style.display).toBe('none');
    expect(byLabel.demozoo.parentElement.style.display).not.toBe('none');
  });

  it('renders credits grouped by role', () => {
    const card = productionCard();
    modal();
    populateModal(getDataFromCard(card));

    const credits = document.getElementById('modal-credits');
    expect(credits.innerText).toBe('Code: Madison\nGraphics: Elko');
  });

  it('falls back to the card image for a production with no youtube url', () => {
    document.body.innerHTML = `
      <article class="card pointer" data-ctype="prod" data-slug="x">
        <div class="card-image"><img src="/img/card/x.webp"></div>
        <div class="card-content"><button class="title">X</button><p class="subtitle">C64 – Intro</p></div>
      </article>`;
    modal();

    const card = /** @type {HTMLElement} */ (document.querySelector('.card'));
    expect(() => populateModal(getDataFromCard(card))).not.toThrow();

    // jsdom resolves an empty src against the base URL, so assert on the attribute.
    const video = /** @type {HTMLIFrameElement} */ (document.getElementById('modal-video'));
    expect(video.getAttribute('src')).toBe('');
    expect(/** @type {HTMLImageElement} */ (document.getElementById('modal-image')).src)
      .toContain('/img/card/x.webp');
  });
});
