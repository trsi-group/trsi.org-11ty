/**
 * Old item URLs and where they now live.
 *
 * Slugs are derived from titles, so renaming an entry in Contentful retires its
 * URL. src/_data/slugAliases.json records each move; this module turns those
 * into redirect pairs for both the generated _redirects file and the build
 * guard, so the two can never disagree about what is still reachable.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ALIAS_PATH = resolve(__dirname, '../../src/_data/slugAliases.json');

/** Where each content type's pages live. Posts are the odd one out. */
export const URL_PREFIX = {
  productions: '/productions',
  graphics: '/graphics',
  music: '/music',
  posts: '/news',
};

/** @returns {Object} The parsed alias document. */
export function loadAliases() {
  return JSON.parse(readFileSync(ALIAS_PATH, 'utf8'));
}

/**
 * Flattens chains, so a rename after a rename still lands in one hop —
 * Netlify applies a single rule and will not follow a redirect to a redirect.
 * @param {Object} map - Raw old-slug to new-slug pairs for one type.
 * @returns {Object} The same pairs with every target fully resolved.
 */
export function resolveAliases(map = {}) {
  const resolved = {};

  for (const from of Object.keys(map)) {
    let to = map[from];
    const seen = new Set([from]);

    while (map[to] !== undefined) {
      if (seen.has(to)) {
        throw new Error(`Alias cycle in slugAliases.json: ${[...seen, to].join(' -> ')}`);
      }
      seen.add(to);
      to = map[to];
    }

    if (to === from) {
      throw new Error(`Alias points at itself in slugAliases.json: ${from}`);
    }
    resolved[from] = to;
  }

  return resolved;
}

/**
 * Every redirect the site should serve, item moves and one-off paths alike.
 * @returns {Array} Objects of { from, to, status }.
 */
export function resolvedRedirects() {
  const doc = loadAliases();

  const items = Object.entries(URL_PREFIX).flatMap(([type, prefix]) =>
    Object.entries(resolveAliases(doc[type])).map(([from, to]) => ({
      from: `${prefix}/${from}/`,
      to: `${prefix}/${to}/`,
      status: 301,
    }))
  );

  const paths = (doc.paths || []).map(({ from, to, status }) => ({ from, to, status: status || 301 }));

  return [...paths, ...items];
}
