import { vi, beforeEach, afterEach } from 'vitest';

// A UTC-negative timezone, so a Date-based date formatter would visibly drift a
// day backwards. See tests/unit/dates.test.js.
process.env.TZ = 'America/Los_Angeles';

// jsdom implements neither of these, and both the hero slider and the card
// player depend on them.
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

if (!window.requestAnimationFrame) {
  // window.setTimeout returns a number; the bare global resolves to Node's Timeout.
  window.requestAnimationFrame = (cb) => window.setTimeout(() => cb(performance.now()), 16);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
}

// jsdom has no canvas backend. Stub a 2D context so the waveform drawing code
// actually runs in tests instead of bailing on a null context. The double is
// intentionally partial: it implements only what drawWave() calls.
// @ts-expect-error - partial CanvasRenderingContext2D test double
HTMLCanvasElement.prototype.getContext = () => ({
  clearRect: () => {},
  fillRect: () => {},
  fillStyle: '',
  globalAlpha: 1,
});

beforeEach(() => {
  document.body.innerHTML = '';
  document.body.className = '';
});

afterEach(() => {
  vi.restoreAllMocks();
});
