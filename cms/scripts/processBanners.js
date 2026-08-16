import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

/**
 * Generates web-sized WebP hero banners from the masters in src/assets/banner/.
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

  for (const file of sources) {
    const sourcePath = path.join(SRC_DIR, file);
    const base = file.replace(SOURCE_RE, '');

    for (const width of WIDTHS) {
      const targetPath = path.join(OUT_DIR, `${base}-${width}.webp`);
      if (!isStale(sourcePath, targetPath)) continue;

      try {
        await sharp(sourcePath)
          .resize(width, null, { withoutEnlargement: true })
          .webp({ quality: QUALITY })
          .toFile(targetPath);
        const kb = Math.round(fs.statSync(targetPath).size / 1024);
        console.log(`processBanners: ${path.basename(targetPath)} (${kb} KB)`);
      } catch (err) {
        console.log(`processBanners: failed on ${sourcePath}:`, err.message);
      }
    }
  }
}

processBanners();
