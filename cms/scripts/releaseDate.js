// A bad release date travels far: the sitemap's <lastmod>, the item page's
// JSON-LD dates and the visible "Released ..." line all read the same field,
// and Google Search Console rejects a sitemap entry over any of them. Contentful
// holds placeholders for releases whose date nobody knows (`1337-01-01`), so
// anything that is not a real date is normalised to unknown here rather than in
// every template that renders it.
//
// An entry without a date must fall back to '' and never null: liquidjs's
// `sort` compares inconsistently against null and scrambles the whole feed,
// while '' orders before every real date and so lands last once reversed.

// The oldest genuine release is from 1989, a year before the group formed;
// anything earlier is a placeholder rather than a date.
const EARLIEST_YEAR = 1970;

/**
 * Normalises a Contentful date field to a `YYYY-MM-DD` string.
 * @param {Object|undefined} field - The localised Contentful field, e.g. `fields.releaseDate`.
 * @returns {string} The date, or '' when it is missing, unparseable or a placeholder.
 */
export function releaseDate(field) {
  const raw = field?.['en-US'];
  if (typeof raw !== 'string') return '';

  // Contentful stores these date-only; keep the calendar day the editor picked
  // instead of letting a timezone shift it, and drop any time part outright.
  const day = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return '';

  const parsed = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return '';
  if (parsed.toISOString().slice(0, 10) !== day) return '';
  if (parsed.getUTCFullYear() < EARLIEST_YEAR) return '';

  return day;
}
