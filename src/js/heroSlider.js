const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Enhances every [data-hero] into a fading carousel. Without JS the markup stays
 * a scroll-snapping strip, which is why the enhanced styles are gated behind the
 * .hero--enhanced class this adds.
 * @param {ParentNode} root
 */
export function initHeroSliders(root = document) {
  root.querySelectorAll('[data-hero]').forEach((node) => {
    const hero = /** @type {HTMLElement} */ (node);
    const slides = /** @type {HTMLElement[]} */ (Array.from(hero.querySelectorAll('.hero__slide')));

    if (slides.length < 2) return;

    const reduced = window.matchMedia(REDUCED_MOTION);
    hero.classList.add('hero--enhanced');

    let index = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
    /** @type {ReturnType<typeof setInterval> | null} */
    let timer = null;

    const show = (next) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    };

    const stop = () => {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    };

    const start = () => {
      const interval = Number(hero.dataset.heroAutoplay || 0);
      if (!interval || reduced.matches) return;
      stop();
      timer = setInterval(() => show(index + 1), interval);
    };

    const goto = (next) => {
      show(next);
      start();
    };

    hero.querySelector('[data-hero-next]')?.addEventListener('click', () => goto(index + 1));
    hero.querySelector('[data-hero-prev]')?.addEventListener('click', () => goto(index - 1));

    hero.addEventListener('keydown', (event) => {
      const key = /** @type {KeyboardEvent} */ (event).key;
      if (key === 'ArrowRight') goto(index + 1);
      if (key === 'ArrowLeft') goto(index - 1);
    });

    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);

    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
    reduced.addEventListener('change', () => (reduced.matches ? stop() : start()));

    show(index);
    start();
  });
}
