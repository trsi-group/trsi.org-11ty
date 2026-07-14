import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { webpName } from './assetPaths.js';

const IMAGE_CONTENT_TYPES = new Set([
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

/**
 * Derivatives generated for every image asset.
 * `width: null` keeps the source resolution.
 * @type {{ dir: string, width: number | null, quality: number }[]}
 */
export const DERIVATIVES = [
  { dir: 'orig', width: null, quality: 80 },
  { dir: 'hero', width: 1600, quality: 82 },
  { dir: 'hero-sm', width: 900, quality: 82 },
  { dir: 'card', width: 800, quality: 80 },
  { dir: 'post', width: 480, quality: 80 },
];

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

/**
 * @typedef {{ fileName: string, contentType: string }} ContentfulFile
 * @typedef {{ fields: { file?: Record<string, ContentfulFile> } }} ContentfulAsset
 */

/**
 * Converts every image asset in the Contentful export to the WebP derivatives
 * listed in DERIVATIVES.
 * @param {{ assets: ContentfulAsset[] }} contentfulData
 * @param {string} exportDir - Target directory, e.g. dist/img
 * @param {string} assetDir - Source directory of the downloaded Contentful assets
 */
export async function copyImageAssets(contentfulData, exportDir, assetDir) {
  const { assets } = contentfulData;

  for (const { dir } of DERIVATIVES) {
    fs.mkdirSync(path.join(exportDir, dir), { recursive: true });
  }

  const jobs = [];

  for (const asset of assets) {
    const file = asset.fields.file?.['en-US'];
    if (!file) continue;

    const { fileName, contentType } = file;
    const sourcePath = findFileRecursively(assetDir, fileName.replace(/ /g, '_'));

    if (!sourcePath) {
      if (IMAGE_CONTENT_TYPES.has(contentType)) {
        console.warn(`Source image not available — asset dir: ${assetDir}, filename: ${fileName}`);
      }
      continue;
    }

    if (!IMAGE_CONTENT_TYPES.has(contentType)) continue;

    for (const { dir, width, quality } of DERIVATIVES) {
      const target = path.join(exportDir, dir, webpName(fileName));
      const pipeline = sharp(sourcePath);
      if (width !== null) {
        pipeline.resize(width, null, { withoutEnlargement: true });
      }
      jobs.push(
        pipeline
          .webp({ quality })
          .toFile(target)
          .catch((err) => {
            console.error(`Error transforming ${sourcePath} → ${dir}:`, err);
          }),
      );
    }
  }

  await Promise.all(jobs);
}

export const name = 'copyImageAssets';
