/**
 * Polls until a condition holds.
 *
 * The players used to inline this with a flag shared across calls, so when a
 * tap raced the background preload the second wait stopped polling the moment
 * the first one finished — and its timeout was guarded by the same flag, so it
 * never rejected either. The promise was orphaned and the tap did nothing, for
 * ever. Each call now owns its own state.
 *
 * @param {Function} isReady - Predicate re-evaluated until it returns true.
 * @param {Object} options - `timeout` and `interval` in ms, plus a `label` for the error.
 * @returns {Promise<void>} Resolves when ready, rejects on timeout.
 */
export function waitUntil(isReady, { timeout = 15000, interval = 100, label = 'library' } = {}) {
  if (isReady()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (action) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      action();
    };

    const timer = setTimeout(
      () => finish(() => reject(new Error(`Timeout waiting for ${label}`))),
      timeout
    );

    const poll = () => {
      if (settled) return;
      if (isReady()) finish(resolve);
      else setTimeout(poll, interval);
    };

    poll();
  });
}
