import { test, expect } from '@playwright/test';

test.describe('homepage layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the five sections of the design, in order', async ({ page }) => {
    const headings = page.locator('.section-head__title, .section--hero');
    await expect(page.locator('.section--hero')).toBeVisible();
    await expect(page.locator('.section-head__title')).toHaveText([
      'Latest News',
      'Latest Productions',
      'Latest Graphics',
      'Latest Music',
    ]);
    expect(await headings.count()).toBe(5);
  });

  test('sections alternate black and #222222', async ({ page }) => {
    const bg = (id) =>
      page.locator(`[aria-labelledby="${id}"]`).evaluate((el) => getComputedStyle(el).backgroundColor);

    expect(await bg('h-news')).toBe('rgb(0, 0, 0)');
    expect(await bg('h-productions')).toBe('rgb(34, 34, 34)');
    expect(await bg('h-graphics')).toBe('rgb(0, 0, 0)');
    expect(await bg('h-music')).toBe('rgb(34, 34, 34)');
  });

  test('alt section bleeds to the viewport edge while content stays on the grid', async ({ page }) => {
    // The old .site-container clamped everything to 1200px, so no section could bleed.
    await page.setViewportSize({ width: 1600, height: 900 });

    const section = await page.locator('[aria-labelledby="h-productions"]').boundingBox();
    const inner = await page.locator('[aria-labelledby="h-productions"] .section__inner').boundingBox();

    expect(section.width).toBe(1600);
    expect(inner.width).toBeLessThanOrEqual(1200);
  });

  test('the hero uses the wider container', async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 900 });

    const hero = await page.locator('.section--hero .section__inner').boundingBox();
    const content = await page.locator('[aria-labelledby="h-news"] .section__inner').boundingBox();

    expect(hero.width).toBeGreaterThan(content.width);
    expect(hero.width).toBeLessThanOrEqual(1440);
  });

  test('card grid reflows from three to two to one column', async ({ page }) => {
    const columns = () =>
      page
        .locator('[aria-labelledby="h-productions"] .card-grid')
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);

    await page.setViewportSize({ width: 1440, height: 900 });
    expect(await columns()).toBe(3);

    await page.setViewportSize({ width: 800, height: 900 });
    expect(await columns()).toBe(2);

    await page.setViewportSize({ width: 500, height: 900 });
    expect(await columns()).toBe(1);
  });

  test('every card shows an accent-coloured date above its title', async ({ page }) => {
    const date = page.locator('[aria-labelledby="h-productions"] .card__date').first();

    await expect(date).toBeVisible();
    await expect(date).toHaveText(/^[A-Z]+ \d{1,2}, \d{4}$/);
    await expect(date).toHaveCSS('color', 'rgb(232, 160, 60)');
  });

  test('card meta sits below the image rather than overlaying it', async ({ page }) => {
    const card = page.locator('[aria-labelledby="h-productions"] .card').first();

    await expect(card.locator('.card-content')).toHaveCSS('position', 'static');

    const image = await card.locator('.card-image').boundingBox();
    const meta = await card.locator('.card-content').boundingBox();

    expect(meta.y).toBeGreaterThanOrEqual(image.y + image.height - 1);
  });

  test('news cards link to their post and show a teaser', async ({ page }) => {
    const card = page.locator('[aria-labelledby="h-news"] .card--news').first();

    await expect(card.locator('.card__teaser')).toBeVisible();
    await expect(card.locator('.card__more')).toHaveText('continue reading');
    await expect(card.locator('a.card__link')).toHaveAttribute('href', /^\/news\/.+\/$/);
  });

  test('the "show all" links point at the right index pages', async ({ page }) => {
    await expect(page.locator('[aria-labelledby="h-productions"] .section-head__more'))
      .toHaveAttribute('href', '/productions/');
    await expect(page.locator('[aria-labelledby="h-music"] .section-head__more'))
      .toHaveAttribute('href', '/music/');
  });
});

test.describe('navigation', () => {
  test('shows all six items with Home marked current', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.site-nav__link')).toHaveText([
      'Home', 'News', 'Members', 'Productions', 'Graphics', 'Music',
    ]);
    await expect(page.locator('.site-nav__link.is-current')).toHaveAttribute('aria-current', 'page');
    await expect(page.locator('.site-nav__link.is-current')).toHaveText('Home');
  });

  test('Music is reachable without the wotw flag', async ({ page }) => {
    await page.goto('/');

    // Below 900px the nav lives behind the burger.
    const burger = page.locator('.navbar-burger');
    if (await burger.isVisible()) await burger.click();

    await expect(page.locator('.site-nav__link', { hasText: 'Music' })).toBeVisible();
  });

  test('the burger opens the nav and reports its state', async ({ page }) => {
    await page.setViewportSize({ width: 500, height: 900 });
    await page.goto('/');

    const burger = page.locator('.navbar-burger');
    await expect(burger).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#navMenu')).not.toBeVisible();

    await burger.click();

    await expect(burger).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#navMenu')).toBeVisible();
  });

  test('an article page marks News as current', async ({ page }) => {
    await page.goto('/news/');
    await page.locator('.card--news a.card__link').first().click();
    await expect(page.locator('.site-nav__link.is-current')).toHaveText('News');
  });
});
