/**
 * Item URLs are derived from titles, and that derivation is a compatibility
 * contract: every slug in src/_data/legacySlugs.json was shared publicly while
 * productions, graphics and music were reachable only as modal fragments on
 * their index page. Two algorithms are already in the wild and they are not
 * interchangeable — "T.R.S.I. The Red Serpent Invasion" slugs to
 * "t-r-s-i-the-red-serpent-invasion" under one and "trsi-the-red-serpent-invasion"
 * under the other. Both live here so the difference stays visible.
 */
import slugify from '@sindresorhus/slugify';

/**
 * Slugs productions, graphics and music. Mirrors Eleventy's own `slugify` filter
 * (its src/Filters/Slugify.js), which has generated the data-slug attributes
 * these pages write into location.hash since the hash URLs were introduced.
 * @param {String} title - The entry title.
 * @returns {String} The slug used in the item's URL.
 */
export function itemSlug(title) {
  return slugify('' + title, { decamelize: false });
}

/**
 * Slugs posts. Predates itemSlug and defines the live /news/<slug>/ paths, so it
 * keeps its own rules: no transliteration, and repeated separators are not
 * collapsed. Do not "unify" it with itemSlug — that renames every news URL.
 * @param {String} title - The post title.
 * @returns {String} The slug used in the post's URL.
 */
export function postSlug(title) {
  return title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
