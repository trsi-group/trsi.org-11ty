/**
 * Owns the AudioContext that every tracker backend shares.
 *
 * ScriptNodePlayer keeps its context on `window._gPlayerAudioCtx` and only
 * builds one when that is still undefined, so creating it here first means the
 * backends adopt ours. That is what makes playback work on iOS: Safari only
 * lets a context start from a real user gesture, and by the time a backend
 * would create one we are several awaits and a multi-megabyte download past
 * the tap.
 */

const CONTEXT_OPTIONS = { latencyHint: 'playback' };

const stateListeners = new Set();

/** Raised when the context refuses to run, which on iOS is usually the ringer switch. */
export class AudioBlockedError extends Error {
  constructor(state) {
    super('Audio could not start — the browser kept the audio context ' + state);
    this.name = 'AudioBlockedError';
    this.contextState = state;
  }
}

/**
 * Declares this page a music player rather than a source of incidental sound.
 * Without it iOS leaves the session 'ambient', which the hardware ringer switch
 * silences — the one iOS rule that mutes Web Audio while leaving <audio> audible.
 */
export function configureAudioSession() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
  } catch (error) {
    // Safari-only, and only from 16.4; everywhere else this simply does not apply.
  }
}

function notify(state) {
  stateListeners.forEach((listener) => listener(state));
}

/**
 * Registers a listener for context state changes, including the non-standard
 * 'interrupted' iOS reports when a call or another app takes the audio session.
 * @param {Function} listener - Called with the new context state.
 */
export function onAudioStateChange(listener) {
  stateListeners.add(listener);
}

/**
 * Creates the shared context and asks it to run.
 *
 * Must be called synchronously from inside the user gesture: awaiting anything
 * beforehand loses the gesture on iOS and the context stays suspended.
 * @returns {AudioContext|null} The shared context, or null if unsupported.
 */
export function unlockAudioContext() {
  configureAudioSession();

  let ctx = window._gPlayerAudioCtx;
  if (!ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor(CONTEXT_OPTIONS);
    } catch (error) {
      console.error('Web Audio is not available:', error);
      return null;
    }
    window._gPlayerAudioCtx = ctx;
    ctx.addEventListener('statechange', () => notify(ctx.state));
  }

  if (ctx.state !== 'running') {
    // Fire and forget: the promise resolves too late to matter inside a gesture.
    try { ctx.resume(); } catch (error) { /* resumed again by waitUntilRunning */ }
  }
  return ctx;
}

/** @returns {AudioContext|null} The shared context, if one exists yet. */
export function getAudioContext() {
  return window._gPlayerAudioCtx || null;
}

/**
 * Resolves once the context is genuinely producing sound. Everything before this
 * only asked it to; iOS can still refuse, and the UI must not claim to be
 * playing when it has.
 * @param {Number} timeoutMs - How long to wait for the state to settle.
 * @returns {Promise<Boolean>} Whether the context reached 'running'.
 */
export function waitUntilRunning(timeoutMs = 2000) {
  const ctx = getAudioContext();
  if (!ctx) return Promise.resolve(false);
  if (ctx.state === 'running') return Promise.resolve(true);

  try { ctx.resume(); } catch (error) { /* state check below is the real answer */ }

  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      ctx.removeEventListener('statechange', onChange);
      resolve(ctx.state === 'running');
    };
    const onChange = () => { if (ctx.state === 'running') finish(); };
    const timer = setTimeout(finish, timeoutMs);
    ctx.addEventListener('statechange', onChange);
  });
}
