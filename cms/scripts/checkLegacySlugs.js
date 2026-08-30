/**
 * Fails the build when a URL that was already shared publicly would stop
 * resolving.
 *
 * Slugs are derived from Contentful titles, so editing a title silently
 * retires a URL that exists on other people's sites.
 * src/_data/legacySlugs.json is the snapshot of what was live;
 * src/_data/slugAliases.json records where anything since renamed has moved to.
 * A legacy URL is fine if it is still generated, or if an alias points it at
 * something that is. Two ways an alias can itself be wrong: pointing at nothing
 * (a 301 into a 404), or pointing away from a slug that is live again, which
 * would redirect visitors off a page that exists.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadAliases, resolveAliases, URL_PREFIX } from './slugAliases.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const legacyPath = resolve(__dirname, '../../src/_data/legacySlugs.json');
const dataDir = resolve(__dirname, '../data');

/**
 * @returns {Object} `unreachable` legacy URLs, plus `dangling` and `shadowing` aliases.
 */
export function checkUrls() {
  const legacy = JSON.parse(readFileSync(legacyPath, 'utf8'));
  const aliasDoc = loadAliases();
  const unreachable = [];
  const dangling = [];
  const shadowing = [];

  const liveSlugs = {};
  Object.keys(URL_PREFIX).forEach((type) => {
    const generated = JSON.parse(readFileSync(resolve(dataDir, `${type}.json`), 'utf8'))[type];
    liveSlugs[type] = new Set(generated.map((item) => item.slug));

    // Checked before resolving, because reverting a title to an earlier name
    // leaves an alias pointing away from it — which reads as a cycle, when what
    // the author actually needs to hear is "delete the stale entry".
    Object.keys(aliasDoc[type] || {}).forEach((from) => {
      if (liveSlugs[type].has(from)) {
        shadowing.push({ type, from, to: aliasDoc[type][from], url: `${URL_PREFIX[type]}/${from}/` });
      }
    });
  });

  if (shadowing.length) return { unreachable, dangling, shadowing };

  Object.keys(URL_PREFIX).forEach((type) => {
    const slugs = liveSlugs[type];
    const aliases = resolveAliases(aliasDoc[type]);

    (legacy[type] || []).forEach((item) => {
      if (slugs.has(item.slug)) return;
      const target = aliases[item.slug];
      if (target && slugs.has(target)) return;
      unreachable.push({
        type,
        ...item,
        was: legacy.legacyUrl[type].replace('<slug>', item.slug),
        note: target ? `aliased to "${target}", which is not generated either` : 'no alias recorded',
      });
    });

    Object.entries(aliases).forEach(([from, to]) => {
      if (!slugs.has(to)) {
        dangling.push({ type, from, to, url: `${URL_PREFIX[type]}/${from}/` });
      }
    });
  });

  return { unreachable, dangling, shadowing };
}

// CLI Execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const legacy = JSON.parse(readFileSync(legacyPath, 'utf8'));
  const total = Object.values(legacy.counts).reduce((sum, n) => sum + n, 0);
  let result;
  try {
    result = checkUrls();
  } catch (error) {
    // A hand-authored loop in the alias map; resolving it is impossible.
    console.error(`Aliases: ${error.message}`);
    process.exit(1);
  }
  const { unreachable, dangling, shadowing } = result;

  if (!unreachable.length && !dangling.length && !shadowing.length) {
    console.log(`Legacy slugs: all ${total} shared URLs still resolve.`);
  } else {
    if (unreachable.length) {
      console.error(`Legacy slugs: ${unreachable.length} of ${total} shared URLs would break.\n`);
      unreachable.forEach((item) => {
        console.error(`  ${item.was}`);
        console.error(`    was: ${JSON.stringify(item.title)} — ${item.note}`);
      });
      console.error('\nEither the Contentful export is stale (re-run npm run build:c-fetch),');
      console.error('or a title changed: record the move in src/_data/slugAliases.json.\n');
    }
    if (dangling.length) {
      console.error(`Aliases: ${dangling.length} point at a slug that is not generated.\n`);
      dangling.forEach((item) => {
        console.error(`  ${item.url} -> "${item.to}" does not exist`);
      });
      console.error('\nFix the target in src/_data/slugAliases.json, or drop the alias.\n');
    }
    if (shadowing.length) {
      console.error(`Aliases: ${shadowing.length} would redirect away from a page that exists.\n`);
      shadowing.forEach((item) => {
        console.error(`  ${item.url} is generated again, but is aliased to "${item.to}"`);
      });
      console.error('\nRemove those entries from src/_data/slugAliases.json.\n');
    }
    process.exit(1);
  }
}

// Export for module usage
export const name = 'checkLegacySlugs';
