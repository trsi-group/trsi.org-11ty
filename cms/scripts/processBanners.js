import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Generates web-sized WebP hero banners from the masters in src/assets/banner/.
 *
 * Only widths the master can actually supply are written, plus the master's own
 * width when it falls between steps. A file named `-1280` is therefore always
 * really 1280px wide, which is what makes the srcset in the hero honest.
 */

const SRC_DIR = 'src/assets/banner';
const OUT_DIR = 'src/public/img/banner';
const WIDTHS = [768, 1280, 1920];
const QUALITY = 72;
const SOURCE_RE = /\.(jpe?g|png|tiff?|webp)$/i;

function isStale(sourcePath, targetPath) {
  if (!fs.existsSync(targetPath)) return true;
  return fs.statSync(sourcePath).mtimeMs > fs.statSync(targetPath).mtimeMs;
}

function targetWidths(sourceWidth) {
  const widths = WIDTHS.filter((w) => w <= sourceWidth);
  if (sourceWidth < Math.max(...WIDTHS) && !widths.includes(sourceWidth)) {
    widths.push(sourceWidth);
  }
  return widths.sort((a, b) => a - b);
}

export async function processBanners() {
  if (!fs.existsSync(SRC_DIR)) {
    console.log(`processBanners: no ${SRC_DIR}, nothing to do`);
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const sources = fs.readdirSync(SRC_DIR).filter((f) => SOURCE_RE.test(f));
  if (!sources.length) {
    console.log(`processBanners: no source images in ${SRC_DIR}`);
    return;
  }

  let written = 0;
  let removed = 0;

  for (const file of sources) {
    const sourcePath = path.join(SRC_DIR, file);
    const base = file.replace(SOURCE_RE, '');

    let meta;
    try {
      meta = await sharp(sourcePath).metadata();
    } catch (err) {
      console.log(`processBanners: cannot read ${sourcePath}:`, err.message);
      continue;
    }

    const widths = targetWidths(meta.width);

    // Drop derivatives that no longer correspond to a target width.
    const keep = new Set(widths.map((w) => `${base}-${w}.webp`));
    for (const existing of fs.readdirSync(OUT_DIR)) {
      const match = existing.match(/^(.+)-(\d+)\.webp$/);
      if (match && match[1] === base && !keep.has(existing)) {
        fs.unlinkSync(path.join(OUT_DIR, existing));
        removed++;
      }
    }

    for (const width of widths) {
      const targetPath = path.join(OUT_DIR, `${base}-${width}.webp`);
      if (!isStale(sourcePath, targetPath)) continue;

      try {
        await sharp(sourcePath)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(targetPath);
        written++;
      } catch (err) {
        console.log(`processBanners: failed on ${sourcePath}:`, err.message);
      }
    }
  }

  console.log(`processBanners: ${sources.length} banners, ${written} written, ${removed} stale removed`);
}

processBanners();
