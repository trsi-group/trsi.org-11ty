/**
 * This script transforms structured content and assets exported from a CMS into
 * processed JSON files and local image assets for use in a static site (e.g., Eleventy).
 *
 * - Loads and parses `content.json` from the export directory.
 * - Transforms content (productions, members, graphics, music) using dedicated functions.
 * - Writes resulting JSON data to the configured destination directory (`_data`).
 * - Copies referenced image assets from the CMS export to the public assets directory (`public/img`).
 *
 */

import 'dotenv/config'; // Load environment variables from .env
import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

import { transformProductions } from './transformProductions.js';
import { transformMembers } from './transformMembers.js';
import { transformGraphics } from './transformGraphics.js';
import { transformMusic } from './transformMusic.js';
import { transformImages } from './transformImages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const jsonSource = resolve(__dirname, '../export/content.json');
const assetsSource = resolve(__dirname, '../export/images.ctfassets.net');
const jsonDest = resolve(__dirname, '../data');
const assetsDest = resolve(__dirname, '../../dist/img');

const transforms = [
  { name: 'productions', fn: transformProductions },
  { name: 'members', fn: transformMembers },
  { name: 'graphics', fn: transformGraphics },
  { name: 'music', fn: transformMusic },
];

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const jsonData = JSON.parse(readFileSync(jsonSource, 'utf8'));

    // Copy assets to local image directory
    transformImages(jsonData, assetsDest, assetsSource);
    console.log(`Image assets written to ${assetsDest}`);

    // Ensure the target directory exists
    if (!existsSync(jsonDest)) {
      mkdirSync(jsonDest, { recursive: true });
    }

    transforms.forEach(({ name, fn }) => {
      const destPath = resolve(jsonDest, `${name}.json`);
      const data = fn(jsonData);
      writeFileSync(destPath, JSON.stringify(data, null, 2));
      console.log(`${name.charAt(0).toUpperCase() + name.slice(1)} data written to ${destPath}`);
    });

  } catch (error) {
    console.error('Error processing data:', error);
    process.exit(1);
  }
}