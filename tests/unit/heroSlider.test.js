import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initHeroSliders } from '../../src/js/heroSlider.js';

const setReducedMotion = (matches) => {
  window.matchMedia = () => ({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
};

const hero = (slideCount, autoplay = 1000) => {
  document.body.innerHTML = `
    <div data-hero${autoplay ? ` data-hero-autoplay="${autoplay}"` : ''}>
      <div class="hero__track">
        ${Array.from({ length: slideCount }, (_, i) =>
          `<figure class="hero__slide${i === 0 ? ' is-active' : ''}"></figure>`).join('')}
      </div>
      <button data-hero-prev></button>
      <button data-hero-next></button>
    </div>`;
};

const activeIndex = () =>
  Array.from(document.querySelectorAll('.hero__slide'))
    .findIndex((slide) => slide.classList.contains('is-active'));

const click = (selector) => /** @type {HTMLElement} */ (document.querySelector(selector)).click();

describe('initHeroSliders', () => {
  beforeEach(() => setReducedMotion(false));

  it('advances forward and wraps to the first slide', () => {
    hero(3);
    initHeroSliders();

    click('[data-hero-next]');
    expect(activeIndex()).toBe(1);
    click('[data-hero-next]');
    expect(activeIndex()).toBe(2);
    click('[data-hero-next]');
    expect(activeIndex()).toBe(0);
  });

  it('wraps backward from the first slide to the last', () => {
    hero(3);
    initHeroSliders();

    click('[data-hero-prev]');
    expect(activeIndex()).toBe(2);
  });

  it('keeps exactly one slide active at all times', () => {
    hero(4);
    initHeroSliders();

    for (let i = 0; i < 7; i++) {
      click('[data-hero-next]');
      expect(document.querySelectorAll('.hero__slide.is-active')).toHaveLength(1);
    }
  });

  it('responds to arrow keys', () => {
    hero(3);
    initHeroSliders();

    const el = document.querySelector('[data-hero]');
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(activeIndex()).toBe(1);
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(activeIndex()).toBe(0);
  });

  it('autoplays on the configured interval', () => {
    vi.useFakeTimers();
    hero(3, 1000);
    initHeroSliders();

    vi.advanceTimersByTime(1000);
    expect(activeIndex()).toBe(1);
    vi.advanceTimersByTime(1000);
    expect(activeIndex()).toBe(2);

    vi.useRealTimers();
  });

  it('never autoplays under prefers-reduced-motion', () => {
    setReducedMotion(true);
    vi.useFakeTimers();
    hero(3, 1000);
    initHeroSliders();

    vi.advanceTimersByTime(10_000);
    expect(activeIndex()).toBe(0);

    vi.useRealTimers();
  });

  it('pauses autoplay while the pointer is over the hero', () => {
    vi.useFakeTimers();
    hero(3, 1000);
    initHeroSliders();

    document.querySelector('[data-hero]').dispatchEvent(new MouseEvent('mouseenter'));
    vi.advanceTimersByTime(5000);
    expect(activeIndex()).toBe(0);

    vi.useRealTimers();
  });

  it('leaves a single-slide hero unenhanced, so no arrows appear', () => {
    hero(1);
    initHeroSliders();

    expect(document.querySelector('[data-hero]').classList.contains('hero--enhanced')).toBe(false);
  });
});
