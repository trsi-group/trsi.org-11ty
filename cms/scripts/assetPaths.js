/** Filename of the WebP derivative for a source asset filename. */
export function webpName(fileName) {
  return fileName.replace(/\.[^/.]+$/, '.webp');
}

/**
 * Web path for an image derivative. Contentful filenames may contain spaces and
 * other characters that are not URL-safe, so the filename segment is encoded.
 * @param {string} dir - Derivative directory, e.g. 'card' | 'hero' | 'orig'
 * @param {string} fileName - Filename, with or without its original extension
 */
export function imgPath(dir, fileName) {
  return `/img/${dir}/${encodeURIComponent(webpName(fileName))}`;
}

/** Web path for a music track. Track files keep their original extension. */
export function trackPath(fileName) {
  return `/tracks/${encodeURIComponent(fileName)}`;
}
