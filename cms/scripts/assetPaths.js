import { extname } from 'path';

/**
 * Contentful file names are not unique: the same name gets uploaded more than
 * once, and the CDN we deploy to resolves paths case-insensitively, so
 * "Sachy.webp" and "sachy.webp" collapse into a single file. Every generated
 * image name therefore carries a slice of the asset id, which keeps the
 * readable original name while guaranteeing the result is unique.
 */
const ID_LENGTH = 8;

// Image URLs embedded in markdown bodies, with or without a scheme.
const ASSET_URL = /(?:https?:)?\/\/images\.ctfassets\.net\/[^\s)"'<>]+/g;

const stripScheme = (url) => url.replace(/^https?:/, '');

// Contentful serves spaces as underscores, so follow its own convention.
const normalise = (fileName) => {
  const ext = extname(fileName);
  return fileName.slice(0, fileName.length - ext.length).replace(/ /g, '_');
};

/**
 * Builds lookups from the Contentful export to the local WebP file name.
 * @param {Array} assets - The assets array of the Contentful export.
 * @returns {Object} Maps keyed by asset id and by Contentful asset URL.
 */
export function buildImageIndex(assets) {
  const byId = new Map();
  const byUrl = new Map();
  const sizeById = new Map();
  const claimedBy = new Map();

  assets.forEach((asset) => {
    // Contentful serves images from its own host; everything else (music
    // tracks) comes from assets.ctfassets.net and is handled by copyTrackAssets.
    // Content types are unreliable here: .sid tracks are typed image/x-mrsid-image.
    const file = asset.fields.file?.['en-US'];
    if (!file || !stripScheme(file.url).startsWith('//images.ctfassets.net/')) return;

    const id = asset.sys.id;
    const fileName = `${normalise(file.fileName)}-${id.slice(0, ID_LENGTH)}.webp`;

    const owner = claimedBy.get(fileName.toLowerCase());
    if (owner && owner !== id) {
      throw new Error(
        `Asset name collision: "${fileName}" claimed by ${owner} and ${id}. Raise ID_LENGTH in assetPaths.js.`
      );
    }
    claimedBy.set(fileName.toLowerCase(), id);

    byId.set(id, fileName);
    byUrl.set(stripScheme(file.url), fileName);

    const size = file.details?.image;
    if (size) sizeById.set(id, { width: size.width, height: size.height });
  });

  return { byId, byUrl, sizeById };
}

/**
 * Returns the pixel dimensions Contentful recorded for an asset. These describe
 * the 'orig' variant, which is converted to WebP without being resized.
 * @param {Object} index - The index returned by buildImageIndex.
 * @param {String} assetId - The Contentful asset id.
 * @returns {Object|null} An object with width and height, or null if unknown.
 */
export function imageSize(index, assetId) {
  return index.sizeById.get(assetId) || null;
}

/**
 * Resolves an asset id to its local path in one of the generated size variants.
 * @param {Object} index - The index returned by buildImageIndex.
 * @param {String} assetId - The Contentful asset id.
 * @param {String} variant - One of 'orig', 'card', 'post' or 'social'.
 * @returns {String|null} The site-absolute path, or null if the asset is unknown.
 */
export function imagePath(index, assetId, variant) {
  const fileName = index.byId.get(assetId);
  if (!fileName) return null;
  // Social previews are JPEG: WebP is fine on Facebook, X and LinkedIn but
  // still trips up older WhatsApp clients, and this is the one image whose
  // job is to render somewhere we do not control.
  const name = variant === 'social' ? fileName.replace(/\.webp$/, '.jpg') : fileName;
  return `/img/${variant}/${name}`;
}

/**
 * Rewrites Contentful image URLs in markdown to their local equivalent, so
 * rendered pages stop hotlinking images.ctfassets.net at runtime.
 * @param {Object} index - The index returned by buildImageIndex.
 * @param {String} markdown - The markdown body to rewrite.
 * @param {String} variant - One of 'orig', 'card' or 'post'.
 * @returns {String} The markdown with asset URLs replaced.
 */
export function localiseAssetUrls(index, markdown, variant) {
  return markdown.replace(ASSET_URL, (url) => {
    const fileName = index.byUrl.get(stripScheme(url));
    if (!fileName) {
      console.log(`No local asset for ${url}`);
      return url;
    }
    return `/img/${variant}/${fileName}`;
  });
}
