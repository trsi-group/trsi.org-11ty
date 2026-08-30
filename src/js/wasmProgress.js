/**
 * Reports how much of a backend's .wasm has arrived.
 *
 * Emscripten fetches the module itself, so the only place to observe it is
 * window.fetch. The wrapper streams the body through a counter and hands back
 * an equivalent Response with its headers intact, so
 * WebAssembly.instantiateStreaming still accepts it. A cached module reports a
 * single jump to 1.
 */

let installed = false;

/**
 * @param {Function} onProgress - Called with a fraction from 0 to 1.
 */
export function installWasmProgress(onProgress) {
  if (installed || typeof window.fetch !== 'function' || !window.ReadableStream) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const url = typeof input === 'string' ? input : input?.url || '';
    const total = Number(response.headers.get('content-length'));

    if (!/\.wasm(\?|$)/.test(url) || !response.body || !total) {
      return response;
    }

    onProgress(0);
    let loaded = 0;

    const counted = new ReadableStream({
      start(controller) {
        const reader = response.body.getReader();
        const pump = () => reader.read().then(({ done, value }) => {
          if (done) {
            onProgress(1);
            controller.close();
            return;
          }
          loaded += value.byteLength;
          onProgress(Math.min(loaded / total, 1));
          controller.enqueue(value);
          pump();
        }).catch((error) => controller.error(error));
        pump();
      },
    });

    // Headers must survive: instantiateStreaming rejects anything that is not
    // served as application/wasm.
    return new Response(counted, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  };
}
