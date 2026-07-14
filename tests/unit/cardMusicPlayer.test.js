import { describe, it, expect, vi, beforeEach } from 'vitest';

const manager = {
  stop: vi.fn(),
  isPlaying: vi.fn(() => false),
  getCurrentTrack: vi.fn(() => null),
  loadAndPlay: vi.fn(() => Promise.resolve()),
  togglePlayback: vi.fn(),
  onStateChange: vi.fn(),
  onError: vi.fn(),
  onTrackEnd: vi.fn(),
  preload: vi.fn(),
};

vi.mock('../../src/js/musicPlayer.js', () => ({ musicPlayerManager: manager }));

const { initMusicCards, decorativePeaks, formatTime } = await import('../../src/js/cardMusicPlayer.js');

const cards = (titles) => {
  document.body.innerHTML = titles
    .map(
      (title, i) => `
      <article class="card pointer" data-ctype="music">
        <div class="card-image">
          <div class="music-card" data-music-card data-asset="/tracks/${i}.mod" data-playeremu="MPT" data-title="${title}">
            <canvas data-music-wave width="600" height="160"></canvas>
            <button data-music-play aria-pressed="false"></button>
            <button data-music-prev></button>
            <button data-music-next></button>
            <p data-music-time></p>
          </div>
        </div>
        <div class="card-content"><p class="title">${title}</p><p class="subtitle">Amiga – Tracked Music</p></div>
      </article>`,
    )
    .join('');
};

const playBtn = (i) => /** @type {HTMLElement} */ (document.querySelectorAll('[data-music-play]')[i]);

describe('decorativePeaks', () => {
  it('is deterministic, so a track looks identical across builds', () => {
    expect(decorativePeaks('Samsara')).toEqual(decorativePeaks('Samsara'));
  });

  it('gives different tracks different waveforms', () => {
    expect(decorativePeaks('Samsara')).not.toEqual(decorativePeaks('60Y by TRSI'));
  });

  it('stays within the drawable 0..1 range', () => {
    for (const peak of decorativePeaks('Escaping Tartarus')) {
      expect(peak).toBeGreaterThan(0);
      expect(peak).toBeLessThanOrEqual(1);
    }
  });
});

describe('formatTime', () => {
  it('formats elapsed and total the way the design shows it', () => {
    expect(formatTime(0, 245)).toBe('0:00 / 4:05');
    expect(formatTime(65, 245)).toBe('1:05 / 4:05');
  });

  it('shows a placeholder when the tracker format reports no duration', () => {
    expect(formatTime(0, 0)).toBe('0:00 / --:--');
  });
});

describe('initMusicCards', () => {
  beforeEach(() => {
    manager.getCurrentTrack.mockReturnValue(null);
    manager.loadAndPlay.mockClear();
    manager.togglePlayback.mockClear();
  });

  it('plays the clicked track', () => {
    cards(['Samsara', '60Y by TRSI']);
    initMusicCards();

    playBtn(0).click();

    expect(manager.loadAndPlay).toHaveBeenCalledWith('/tracks/0.mod', 'Samsara', 'MPT');
  });

  it('does not open the modal when a transport button is clicked', () => {
    // The player sits inside a .card.pointer whose click handler opens the modal.
    cards(['Samsara']);
    initMusicCards();

    const onCardClick = vi.fn();
    document.querySelector('.card.pointer').addEventListener('click', onCardClick);

    playBtn(0).click();
    /** @type {HTMLElement} */ (document.querySelector('[data-music-next]')).click();
    /** @type {HTMLElement} */ (document.querySelector('[data-music-prev]')).click();

    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('toggles instead of reloading when the same track is already loaded', () => {
    cards(['Samsara']);
    initMusicCards();

    manager.getCurrentTrack.mockReturnValue({ url: '/tracks/0.mod', title: 'Samsara' });
    playBtn(0).click();

    expect(manager.togglePlayback).toHaveBeenCalled();
    expect(manager.loadAndPlay).not.toHaveBeenCalled();
  });

  it('starting a second card loads that track, since the player is a singleton', () => {
    cards(['Samsara', '60Y by TRSI']);
    initMusicCards();

    playBtn(0).click();
    playBtn(1).click();

    expect(manager.loadAndPlay).toHaveBeenLastCalledWith('/tracks/1.mod', '60Y by TRSI', 'MPT');
  });

  it('next wraps from the last card round to the first', () => {
    cards(['A', 'B']);
    initMusicCards();

    const lastNext = document.querySelectorAll('[data-music-next]')[1];
    /** @type {HTMLElement} */ (lastNext).click();

    expect(manager.loadAndPlay).toHaveBeenLastCalledWith('/tracks/0.mod', 'A', 'MPT');
  });
});
