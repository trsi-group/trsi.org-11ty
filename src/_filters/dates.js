const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
];

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/;

/**
 * "2026-04-05" -> "APRIL 5, 2026".
 *
 * Parses the string directly rather than going through Date: `new Date("2026-04-05")`
 * is UTC midnight, and formatting that in a UTC-negative timezone yields the
 * previous day.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function displayDate(value) {
  if (!value) return '';
  const match = ISO_DATE.exec(String(value));
  if (!match) return '';

  const [, year, month, day] = match;
  const monthName = MONTHS[Number(month) - 1];
  if (!monthName) return '';

  return `${monthName} ${Number(day)}, ${year}`;
}

/**
 * Normalises a CMS date to a bare ISO date for <time datetime="...">.
 * @param {string | null | undefined} value
 * @returns {string}
 */
export function isoDate(value) {
  if (!value) return '';
  const match = ISO_DATE.exec(String(value));
  return match ? match[0] : '';
}
