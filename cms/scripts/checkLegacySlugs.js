/**
 * Fails the build when a URL that was already shared publicly would stop
 * resolving.
 *
 * Productions, graphics and music were addressable only as modal fragments on
 * their index page (/productions/#<slug>), and posts as /news/<slug>/. Those
 * slugs are derived from Contentful titles, so editing a title silently retires
 * a URL that exists on other people's sites. src/_data/legacySlugs.json is the
 * snapshot of what was live; the generated data must stay a superset of it.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const legacyPath = resolve(__dirname, '../../src/_data/legacySlugs.json');
const dataDir = resolve(__dirname, '../data');

/**
 * Compares the snapshot against the freshly generated data.
 * @returns {Array} One entry per legacy slug that is no longer generated.
 */
export function findMissingSlugs() {
  const legacy = JSON.parse(readFileSync(legacyPath, 'utf8'));
  const missing = [];

  Object.keys(legacy.legacyUrl).forEach((type) => {
    const generated = JSON.parse(readFileSync(resolve(dataDir, `${type}.json`), 'utf8'))[type];
    const slugs = new Set(generated.map((item) => item.slug));

    legacy[type].forEach((item) => {
      if (!slugs.has(item.slug)) {
        missing.push({ type, ...item, was: legacy.legacyUrl[type].replace('<slug>', item.slug) });
      }
    });
  });

  return missing;
}

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const legacy = JSON.parse(readFileSync(legacyPath, 'utf8'));
  const missing = findMissingSlugs();
  const total = Object.values(legacy.counts).reduce((sum, n) => sum + n, 0);

  if (missing.length === 0) {
    console.log(`Legacy slugs: all ${total} shared URLs still resolve.`);
  } else {
    console.error(`Legacy slugs: ${missing.length} of ${total} shared URLs would break.\n`);
    missing.forEach((item) => {
      console.error(`  ${item.was}`);
      console.error(`    was: ${JSON.stringify(item.title)}`);
    });
    console.error('\nEither the Contentful export is stale (re-run npm run build:c-fetch),');
    console.error('or a title changed and src/_data/legacySlugs.json needs a redirect for it.');
    process.exit(1);
  }
}

// Export for module usage
export const name = 'checkLegacySlugs';
