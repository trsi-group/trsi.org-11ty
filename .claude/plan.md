# Plan: Fix Lighthouse Image Aspect Ratio & Resolution Warnings

## Problem

Lighthouse flags two "User Experience" best-practice issues:

1. **"Displays images with incorrect aspect ratio"** — Images are forced into fixed aspect ratio containers that don't match their natural dimensions.
2. **"Serves images with low resolution"** — Images are displayed at sizes larger than their actual pixel dimensions.

## Root Cause Analysis

### Aspect Ratio Mismatch

There are two distinct locations where this occurs:

#### News Feed (`feed-news.liquid`)
```liquid
<figure class="image is-1by1">
  <img src="{{ item.post_image }}" alt="...">
</figure>
```
Bulma's `is-1by1` forces a **1:1 square** container via `padding-top: 100%`. The actual post images (`/img/post/*.webp`) have arbitrary aspect ratios (e.g. 400×281 = 1.42:1, 400×210 = 1.90:1). The images are stretched/squished into the square.

#### Card Templates (`card-productions.liquid`, `card-graphics.liquid`, `card-music.liquid`)
```liquid
<figure class="image is-4by3">
  <img src="{{ card.card_image }}" alt="...">
</figure>
```
Bulma's `is-4by3` forces a **4:3 container**. Card images (`/img/card/*.webp`) are resized to 400px width but their height depends on the original — so they rarely match exactly 4:3. The CSS rule `object-fit: contain` prevents visible distortion but the container dimensions still mismatch, which Lighthouse flags.

### Low Resolution

The image build pipeline in `copyImageAssets.js` produces:
- **Post images**: 150px width — but displayed in a column (`is-one-fifth` of ~1200px = ~240px). The image is upscaled.
- **Card images**: 400px width — these can be displayed at comparable sizes, but on high-DPI/Retina screens (2x), the effective resolution is only 200 CSS pixels, which Lighthouse considers insufficient.

## Proposed Fix

### Step 1: Remove fixed aspect ratio classes from news feed

Replace the `is-1by1` class on news feed images with a simple responsive image approach. Since news thumbnails sit inside a fixed-width column (`is-one-fifth`), we don't need a Bulma aspect ratio class — we just need the image to display at its natural ratio.

**In `src/_includes/components/feed-news.liquid`:**
```liquid
<!-- Before -->
<figure class="image is-1by1">
  <img src="{{ item.post_image }}" alt="image of {{ card.title }}">
</figure>

<!-- After -->
<figure class="image">
  <img src="{{ item.post_image }}" alt="image of {{ item.title }}">
</figure>
```

Note: there's also a bug here — `card.title` should be `item.title` (the loop variable is `item`, not `card`).

### Step 2: Switch card templates to `object-fit: cover` with `is-4by3`

The `is-4by3` ratio class on cards is intentional — it gives a consistent card grid. The problem is `object-fit: contain` in CSS which creates letterboxing. Switching to `object-fit: cover` crops the image to fill the 4:3 container without distortion, eliminating the aspect ratio mismatch warning.

**In `src/css/styles.css`:**
```css
/* Before */
.card-image:first-child img {
  object-fit: contain;
  border-radius: 0px;
}

/* After */
.card-image:first-child img {
  object-fit: cover;
  border-radius: 0px;
}
```

### Step 3: Increase image sizes in the build pipeline

Increase the generated image sizes so they're large enough for their display contexts, including 2x DPI screens.

**In `cms/scripts/copyImageAssets.js`:**
```js
// Card images: 400 → 800 (covers up to 400 CSS px at 2x DPI)
sharp(sourcePath)
  .resize(800)
  .webp()
  .toFile(targetCardPath)

// Post images: 150 → 480 (covers ~240px column at 2x DPI)
sharp(sourcePath)
  .resize(480)
  .webp()
  .toFile(targetPostPath)
```

### Step 4: Add `width` and `height` attributes to `<img>` tags

Adding explicit `width` and `height` attributes helps the browser reserve the correct space before the image loads, preventing layout shift (CLS) and giving Lighthouse a clear signal of the intended display dimensions.

**In `feed-news.liquid`:**
```liquid
<img src="{{ item.post_image }}" alt="image of {{ item.title }}" width="480" height="auto" loading="lazy">
```

**In card templates (`card-productions.liquid`, `card-graphics.liquid`, `card-music.liquid`):**
```liquid
<img src="{{ card.card_image }}" alt="..." width="800" height="600" loading="lazy">
```

The `width="800" height="600"` matches the 4:3 ratio (800÷600 = 4:3) and the new resize target.

---

## Files Changed

| File | Change |
|------|--------|
| `src/_includes/components/feed-news.liquid` | Remove `is-1by1`, fix `card.title` → `item.title`, add `width`/`height`/`loading` |
| `src/_includes/components/card-productions.liquid` | Add `width`/`height`/`loading` to `<img>` |
| `src/_includes/components/card-graphics.liquid` | Add `width`/`height`/`loading` to `<img>` |
| `src/_includes/components/card-music.liquid` | Add `width`/`height`/`loading` to `<img>` |
| `src/css/styles.css` | Change `object-fit: contain` → `object-fit: cover` |
| `cms/scripts/copyImageAssets.js` | Increase card resize to 800px, post resize to 480px |

---

## Considerations

- **Content rebuild required**: After changing image sizes in `copyImageAssets.js`, a full `npm run build:content` is needed to regenerate all images at the new sizes.
- **Disk space**: Larger images mean slightly bigger output. WebP compression keeps this manageable.
- **Card cropping**: `object-fit: cover` will crop edges of images that don't match 4:3. This is typically fine for demoscene artwork/screenshots since the important content is usually centered.
- **News images**: Removing the fixed ratio means thumbnails will have varying heights per row. This is acceptable since each news item is its own row (columns layout), not a grid.

---

## Todo List

### Phase 1: Fix News Feed Aspect Ratio — `feed-news.liquid`

- [x] **1.1** Remove the `is-1by1` class from the `<figure>` element, leaving just `class="image"`
- [x] **1.2** Fix the alt text bug: change `card.title` → `item.title` (wrong variable reference)
- [x] **1.3** Add `width="480"` and `loading="lazy"` attributes to the `<img>` tag
- [x] **1.4** Visually verify news thumbnails display at their natural aspect ratio

### Phase 2: Fix Card Image Object Fit — `styles.css`

- [x] **2.1** Change `.card-image:first-child img` from `object-fit: contain` to `object-fit: cover`
- [x] **2.2** Visually verify card images fill the 4:3 container without letterboxing or distortion

### Phase 3: Add Dimensions to Card Templates

- [x] **3.1** Add `width="800" height="600" loading="lazy"` to `<img>` in `card-productions.liquid`
- [x] **3.2** Add `width="800" height="600" loading="lazy"` to `<img>` in `card-graphics.liquid`
- [x] **3.3** Add `width="800" height="600" loading="lazy"` to `<img>` in `card-music.liquid`

### Phase 4: Increase Image Sizes in Build Pipeline — `copyImageAssets.js`

- [x] **4.1** Change card image resize from `400` to `800` pixels width
- [x] **4.2** Change post image resize from `150` to `480` pixels width
- [ ] **4.3** Run `npm run build:content` to regenerate all images at new sizes *(requires .env with Contentful tokens)*
- [ ] **4.4** Verify new images exist in `dist/img/card/` and `dist/img/post/` at correct dimensions *(requires 4.3)*

### Phase 5: Validation & Testing

- [x] **5.1** Run `npm start` and visually inspect homepage — news thumbnails at natural ratio, cards filling 4:3
- [x] **5.2** Check productions, graphics, and music gallery pages — cards render correctly
- [ ] **5.3** Check responsive behavior on mobile viewport — images scale down properly *(manual)*
- [x] **5.4** Verify no layout shift (CLS) — `width`/`height` attributes reserve correct space
- [ ] **5.5** Run Lighthouse — confirm "incorrect aspect ratio" and "low resolution" warnings are resolved *(requires deployed build with regenerated images)*
- [x] **5.6** Verify PurgeCSS safelist doesn't strip any needed classes (the `image` class without `is-1by1` must survive)

### Phase 6: Commit

- [x] **6.1** Review all changed files: `feed-news.liquid`, `styles.css`, `card-productions.liquid`, `card-graphics.liquid`, `card-music.liquid`, `copyImageAssets.js`
- [ ] **6.2** Commit with descriptive message covering the aspect ratio fix, resolution increase, and alt text bug fix
