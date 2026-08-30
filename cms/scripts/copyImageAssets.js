import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { buildImageIndex } from './assetPaths.js';

const SOCIAL_WIDTH = 1200;
const SOCIAL_HEIGHT = 630;
// The page background, so a letterboxed preview sits on the site's own colour
// rather than on white.
const SOCIAL_BACKGROUND = { r: 10, g: 10, b: 10 };
// Sources narrower than this are being scaled up into the preview frame, and
// smoothing turns pixel art to mush.
const PIXEL_ART_MAX_WIDTH = 800;

/**
 * Recursively searches for a file in a directory and its subdirectories.
 * @param {String} dir - The directory to search.
 * @param {String} fileName - The name of the file to find.
 * @returns {String|null} - The full path to the file if found, otherwise null.
 */
function findFileRecursively(dir, fileName) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      const result = findFileRecursively(fullPath, fileName);
      if (result) return result;
    } else if (file.isFile() && file.name === fileName) {
      return fullPath;
    }
  }

  return null;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/**
 * Renders one link-preview image: the artwork letterboxed onto a fixed
 * 1200x630 frame, which is the size every unfurler expects.
 * @param {String} sourcePath - The image to render from.
 * @param {String} targetPath - Where to write the JPEG.
 */
async function writeSocialImage(sourcePath, targetPath) {
  const { width } = await sharp(sourcePath).metadata();

  await sharp(sourcePath)
    .resize(SOCIAL_WIDTH, SOCIAL_HEIGHT, {
      fit: 'contain',
      background: SOCIAL_BACKGROUND,
      kernel: width && width < PIXEL_ART_MAX_WIDTH ? 'nearest' : 'lanczos3',
    })
    .flatten({ background: SOCIAL_BACKGROUND })
    .jpeg({ quality: 82, progressive: true })
    .toFile(targetPath);
}

/**
 * Renders preview images for the checked-in fallback artwork, so a track with
 * no cover of its own still unfurls as something better than the site logo.
 * @param {String} publicImgDir - Where the static images live.
 * @param {String} exportDir - The generated image directory.
 */
export async function copyFallbackSocialImages(publicImgDir, exportDir) {
  const targetDir = path.join(exportDir, 'social');
  ensureDir(targetDir);

  const names = ['music-amiga', 'music-c64', 'music-player'];
  await Promise.all(names.map(async (name) => {
    const sourcePath = path.join(publicImgDir, `${name}.webp`);
    if (!fs.existsSync(sourcePath)) return;
    await writeSocialImage(sourcePath, path.join(targetDir, `${name}.jpg`));
  }));
}

/**
 * Copies image assets from the Contentful export to the local image directory.
 * @param {Object} contentfulData - The raw JSON data exported from Contentful.
 * @param {String} exportDir - The directory the variants are written to.
 * @param {String} assetDir - The downloaded Contentful assets.
 */
export async function copyImageAssets(contentfulData, exportDir, assetDir) {
  const { assets } = contentfulData;
  const index = buildImageIndex(assets);

  ensureDir(exportDir);
  ['orig', 'card', 'post', 'social'].forEach((variant) => ensureDir(path.join(exportDir, variant)));

  const work = assets.map(async (asset) => {
    const file = asset.fields.file?.['en-US'];
    if (!file) return;

    // Non-image assets (music tracks) are handled by copyTrackAssets
    const targetName = index.byId.get(asset.sys.id);
    if (!targetName) return;

    const sourcePath = findFileRecursively(assetDir, file.fileName.replace(/ /g, '_'));
    if (!sourcePath) {
      console.log('Source images not available!');
      console.log(`asset dir: ${assetDir}, filename: ${file.fileName}`);
      return;
    }

    try {
      await Promise.all([
        // Transform the original file to WebP without resizing
        sharp(sourcePath).webp().toFile(path.join(exportDir, 'orig', targetName)),
        // Resize for Card display
        sharp(sourcePath).resize(800).webp().toFile(path.join(exportDir, 'card', targetName)),
        // Resize for Post display
        sharp(sourcePath).resize(480).webp().toFile(path.join(exportDir, 'post', targetName)),
        // Link previews
        writeSocialImage(sourcePath, path.join(exportDir, 'social', targetName.replace(/\.webp$/, '.jpg'))),
      ]);
    } catch (err) {
      console.log(`Error transforming ${sourcePath}:`, err.message);
    }
  });

  // Awaited rather than fired and forgotten, so the build cannot finish while
  // images are still being written.
  await Promise.all(work);
}

// Export for module usage
export const name = 'copyImageAssets';
