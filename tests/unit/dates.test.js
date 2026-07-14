import { describe, it, expect } from 'vitest';
import { displayDate, isoDate } from '../../src/_filters/dates.js';

describe('displayDate', () => {
  it('formats an ISO date the way the design shows it', () => {
    expect(displayDate('2026-04-05')).toBe('APRIL 5, 2026');
    expect(displayDate('2026-07-10')).toBe('JULY 10, 2026');
    expect(displayDate('2025-10-04')).toBe('OCTOBER 4, 2025');
  });

  it('does not drift a day backwards in a UTC-negative timezone', () => {
    // tests/setup.js pins TZ=America/Los_Angeles. `new Date("2026-01-01")` is
    // UTC midnight, which formats as DECEMBER 31 there. Parsing the string avoids it.
    expect(process.env.TZ).toBe('America/Los_Angeles');
    expect(displayDate('2026-01-01')).toBe('JANUARY 1, 2026');
    expect(displayDate('2026-12-31')).toBe('DECEMBER 31, 2026');
  });

  it('drops the leading zero on the day, as the design does', () => {
    expect(displayDate('2026-04-05')).toContain(' 5,');
    expect(displayDate('2026-04-05')).not.toContain(' 05,');
  });

  it('handles every empty shape the CMS actually produces', () => {
    // productions use '', graphics and music use null
    expect(displayDate('')).toBe('');
    expect(displayDate(null)).toBe('');
    expect(displayDate(undefined)).toBe('');
    expect(displayDate('not a date')).toBe('');
  });

  it('rejects an out-of-range month rather than printing undefined', () => {
    expect(displayDate('2026-13-01')).toBe('');
    expect(displayDate('2026-00-01')).toBe('');
  });
});

describe('isoDate', () => {
  it('returns a bare ISO date for <time datetime>', () => {
    expect(isoDate('2026-04-05')).toBe('2026-04-05');
    expect(isoDate('2026-04-05T12:00:00Z')).toBe('2026-04-05');
  });

  it('returns an empty string for missing or malformed values', () => {
    expect(isoDate(null)).toBe('');
    expect(isoDate('')).toBe('');
    expect(isoDate('nope')).toBe('');
  });
});
