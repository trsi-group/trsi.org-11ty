import { musicPlayerManager } from './musicPlayer.js';

const BAR_COUNT = 96;
const BAR_GAP = 1;

/**
 * The wasm players synthesise tracker/SID formats in real time, so there is no
 * decoded buffer to compute true peaks from until a track has played through.
 * These bars are derived from the title instead: stable across builds, and
 * distinct per track. Playback progress fills them, which is what the design shows.
 * @param {string} title
 * @returns {number[]}
 */
export function decorativePeaks(title) {
  let hash = 2166136261;
  for (const char of title) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }

  return Array.from({ length: BAR_COUNT }, (_, i) => {
    hash = Math.imul(hash ^ i, 16777619);
    return 0.2 + (((hash >>> 8) & 0xff) / 255) * 0.8;
  });
}

/**
 * @param {number} elapsed - seconds
 * @param {number} total - seconds, or 0 when unknown
 * @returns {string}
 */
export function formatTime(elapsed, total) {
  const clock = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  return `${clock(elapsed)} / ${total > 0 ? clock(total) : '--:--'}`;
}

/**
 * @returns {ScriptNodePlayerInstance | null}
 */
function engine() {
  return window.ScriptNodePlayer?.getInstance?.() ?? null;
}

/**
 * Elapsed and total seconds for the running track. Duration is not always
 * available, in which case total is 0.
 * @returns {{ elapsed: number, total: number, progress: number }}
 */
function readPlayback() {
  const player = engine();
  if (!player) return { elapsed: 0, total: 0, progress: 0 };

  const adapter = player._backendAdapter;
  const positionMs = adapter?.getPlaybackPosition?.() ?? -1;
  const maxMs = adapter?.getMaxPlaybackPosition?.() ?? -1;

  const elapsed = positionMs > 0 ? positionMs / 1000 : (player.getCurrentPlaytime?.() ?? 0);
  const total = maxMs > 0 ? maxMs / 1000 : 0;
  const progress = total > 0 ? Math.min(1, elapsed / total) : 0;

  return { elapsed, total, progress };
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {number[]} peaks
 * @param {number} progress - 0..1
 */
function drawWave(canvas, peaks, progress) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  const wave = getComputedStyle(canvas).getPropertyValue('--color-wave').trim() || '#c93b2f';

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = wave;

  const barWidth = width / peaks.length;
  const mid = height / 2;

  peaks.forEach((peak, i) => {
    const barHeight = peak * height * 0.9;
    // The whole waveform is drawn in the accent red; the played part is opaque
    // and the rest is dimmed, so progress reads as the waveform filling up.
    ctx.globalAlpha = i / peaks.length <= progress ? 1 : 0.45;
    ctx.fillRect(i * barWidth, mid - barHeight / 2, Math.max(1, barWidth - BAR_GAP), barHeight);
  });

  ctx.globalAlpha = 1;
}

/**
 * Turns every [data-music-card] into an inline player. MusicPlayerManager is a
 * singleton, so starting one card stops whatever else was playing.
 * @param {ParentNode} root
 */
export function initMusicCards(root = document) {
  const cards = /** @type {HTMLElement[]} */ (Array.from(root.querySelectorAll('[data-music-card]')));
  if (cards.length === 0) return;

  /** @type {number | null} */
  let frame = null;
  /** @type {HTMLElement | null} */
  let active = null;

  const views = cards.map((card, index) => {
    const canvas = /** @type {HTMLCanvasElement} */ (card.querySelector('[data-music-wave]'));
    const playBtn = /** @type {HTMLButtonElement} */ (card.querySelector('[data-music-play]'));
    const time = /** @type {HTMLElement} */ (card.querySelector('[data-music-time]'));
    const peaks = decorativePeaks(card.dataset.title || String(index));

    return { card, canvas, playBtn, time, peaks, index };
  });

  const reset = (view) => {
    view.playBtn.setAttribute('aria-pressed', 'false');
    view.time.textContent = formatTime(0, 0);
    drawWave(view.canvas, view.peaks, 0);
  };

  const stopLoop = () => {
    if (frame === null) return;
    cancelAnimationFrame(frame);
    frame = null;
  };

  const tick = () => {
    const view = views.find((candidate) => candidate.card === active);
    if (!view) return stopLoop();

    const { elapsed, total, progress } = readPlayback();
    view.time.textContent = formatTime(elapsed, total);
    drawWave(view.canvas, view.peaks, progress);

    frame = requestAnimationFrame(tick);
  };

  const play = async (view) => {
    const asset = view.card.dataset.asset;
    if (!asset) return;

    const current = musicPlayerManager.getCurrentTrack();

    if (current && current.url === asset) {
      musicPlayerManager.togglePlayback();
      return;
    }

    views.forEach(reset);
    active = view.card;

    musicPlayerManager.onStateChange((isPlaying) => {
      view.playBtn.setAttribute('aria-pressed', String(isPlaying));
      if (isPlaying) {
        stopLoop();
        frame = requestAnimationFrame(tick);
      } else {
        stopLoop();
      }
    });

    musicPlayerManager.onTrackEnd(() => {
      stopLoop();
      active = null;
      reset(view);
    });

    musicPlayerManager.onError((error) => {
      console.error('Music card player error:', error);
      stopLoop();
      active = null;
      reset(view);
    });

    await musicPlayerManager.loadAndPlay(asset, view.card.dataset.title || '', view.card.dataset.playeremu || null);
  };

  views.forEach((view) => {
    reset(view);

    // The card itself is a .card.pointer that opens the modal, so every control
    // inside it has to keep its click to itself.
    view.playBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      play(view);
    });

    view.card.querySelector('[data-music-next]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      play(views[(view.index + 1) % views.length]);
    });

    view.card.querySelector('[data-music-prev]')?.addEventListener('click', (event) => {
      event.stopPropagation();
      event.preventDefault();
      play(views[(view.index - 1 + views.length) % views.length]);
    });

    view.canvas.addEventListener('click', (event) => {
      event.stopPropagation();

      const player = engine();
      const adapter = player?._backendAdapter;
      const maxMs = adapter?.getMaxPlaybackPosition?.() ?? -1;
      if (!player || maxMs <= 0 || active !== view.card) return;

      const bounds = view.canvas.getBoundingClientRect();
      const ratio = (event.clientX - bounds.left) / bounds.width;
      player.seekPlaybackPosition?.(Math.round(maxMs * Math.min(1, Math.max(0, ratio))));
    });
  });
}
