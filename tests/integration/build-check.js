import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const dist = resolve(root, 'dist');

const CSS_BUDGET_BYTES = 60 * 1024;

/** @type {string[]} */
const failures = [];
const check = (label, ok, detail = '') => {
  if (ok) {
    console.log(`  ok    ${label}`);
  } else {
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    failures.push(label);
  }
};

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(full);
    return entry.isFile() && entry.name.endsWith('.html') ? [full] : [];
  });
}

console.log('Build check\n');

check('dist/ exists', existsSync(dist));
if (!existsSync(dist)) process.exit(1);

const pages = htmlFiles(dist);
check('pages were written', pages.length > 0, `${pages.length} html files`);

// Hero derivatives must exist, or the hero falls back to a missing image.
check('dist/img/hero is populated', existsSync(resolve(dist, 'img/hero')) &&
  readdirSync(resolve(dist, 'img/hero')).length > 0);

// Every referenced image must resolve on disk. Paths are URL-encoded, because
// Contentful filenames contain spaces.
const missing = [];
const unencoded = [];

for (const page of pages) {
  const html = readFileSync(page, 'utf8');

  for (const match of html.matchAll(/(?:src|srcset)="([^"]+)"/g)) {
    for (const candidate of match[1].split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (!url.startsWith('/img/') && !url.startsWith('/tracks/')) continue;

      if (/\s/.test(url)) unencoded.push(`${page}: ${url}`);

      const onDisk = resolve(dist, decodeURIComponent(url).replace(/^\//, ''));
      if (!existsSync(onDisk)) missing.push(`${page}: ${url}`);
    }
  }
}

check('every referenced image resolves on disk', missing.length === 0, missing.slice(0, 5).join('; '));
check('no unencoded spaces in asset URLs', unencoded.length === 0, unencoded.slice(0, 5).join('; '));

// PurgeCSS runs with variables:true and will strip design tokens unless safelisted.
const cssPath = resolve(dist, 'css/main.min.css');
check('main.min.css was built', existsSync(cssPath));

if (existsSync(cssPath)) {
  const css = readFileSync(cssPath, 'utf8');
  const size = statSync(cssPath).size;

  check(`css within budget (${(size / 1024).toFixed(1)}kb <= 60kb)`, size <= CSS_BUDGET_BYTES);

  for (const token of ['--color-accent', '--color-bg-alt', '--ratio-card', '--section-pad']) {
    check(`token ${token} survived purge`, css.includes(token));
  }
  for (const cls of ['.section--alt', '.hero__slide', '.card__date', '.music-card']) {
    check(`class ${cls} survived purge`, css.includes(cls));
  }
}

// The homepage must carry all four feed sections.
const home = readFileSync(resolve(dist, 'index.html'), 'utf8');
for (const id of ['h-news', 'h-productions', 'h-graphics', 'h-music']) {
  check(`homepage renders section ${id}`, home.includes(`aria-labelledby="${id}"`));
}
check('homepage renders exactly one modal', (home.match(/id="modal-overlay"/g) || []).length === 1);
check('homepage renders dates', /class="card__date"/.test(home));

console.log(`\n${failures.length === 0 ? 'All checks passed.' : `${failures.length} check(s) failed.`}`);
process.exit(failures.length === 0 ? 0 : 1);
