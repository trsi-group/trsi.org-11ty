import { test, expect } from '@playwright/test';

test.describe('card modal', () => {
  test('opens from a production card and loads the YouTube embed', async ({ page }) => {
    await page.goto('/productions/');
    await page.locator('.card.pointer').first().click();

    const modal = page.locator('#modal-overlay');
    await expect(modal).toHaveClass(/is-active/);
    await expect(page.locator('#modal-video')).toHaveAttribute('src', /youtube-nocookie\.com\/embed\//);
  });

  test('Escape closes the modal and clears the iframe so audio stops', async ({ page }) => {
    await page.goto('/productions/');
    await page.locator('.card.pointer').first().click();
    await expect(page.locator('#modal-overlay')).toHaveClass(/is-active/);

    await page.keyboard.press('Escape');

    await expect(page.locator('#modal-overlay')).not.toHaveClass(/is-active/);
    await expect(page.locator('#modal-video')).toHaveAttribute('src', '');
  });

  test('the card title is a real button that opens the modal by keyboard', async ({ page }) => {
    await page.goto('/productions/');

    await page.locator('.card.pointer .card__open').first().focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('#modal-overlay')).toHaveClass(/is-active/);
  });

  test('shows only the action buttons that have a URL', async ({ page }) => {
    await page.goto('/productions/');
    await page.locator('.card.pointer').first().click();

    const visible = page.locator('.modal-actions .button:visible');
    expect(await visible.count()).toBeGreaterThan(0);

    // The row itself must survive even when some buttons are hidden.
    await expect(page.locator('.modal-actions')).toBeVisible();
  });
});

test.describe('filters and sort', () => {
  test('filtering productions by platform hides the rest', async ({ page }) => {
    await page.goto('/productions/');

    const all = await page.locator('#feed-wrapper .card-grid__item').count();
    await page.selectOption('#PlatformFilter', { index: 1 });

    const shown = await page.locator('#feed-wrapper .card-grid__item:visible').count();
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(all);
  });

  test('members sort by status reorders the grid', async ({ page }) => {
    await page.goto('/members/');

    const handles = () =>
      page.locator('#feed-wrapper .card-grid__item').evaluateAll((els) =>
        els.map((el) => el.getAttribute('data-sort-handle')),
      );

    const before = await handles();
    await page.selectOption('#SortSelect', 'status');
    const after = await handles();

    expect(after).not.toEqual(before);
    expect(after.slice().sort()).toEqual(before.slice().sort());
  });

  test('the members page has no filter selects and still does not error', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('/members/');
    await page.selectOption('#SortSelect', 'handle');

    expect(await page.locator('#TypeFilter').count()).toBe(0);
    expect(errors).toEqual([]);
  });
});

test.describe('music cards', () => {
  test('render an inline player with transport and a time readout', async ({ page }) => {
    await page.goto('/music/');

    const card = page.locator('[data-music-card]').first();
    await expect(card.locator('[data-music-wave]')).toBeVisible();
    await expect(card.locator('[data-music-play]')).toBeVisible();
    await expect(card.locator('[data-music-time]')).toHaveText(/\d:\d{2} \/ (\d:\d{2}|--:--)/);
  });

  test('clicking play does not also open the modal', async ({ page }) => {
    await page.goto('/music/');

    await page.locator('[data-music-play]').first().click();

    await expect(page.locator('#modal-overlay')).not.toHaveClass(/is-active/);
  });
});

test.describe('hero', () => {
  test('renders a slide and no arrows while there is only one', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('.hero__slide')).toHaveCount(1);
    await expect(page.locator('.hero__slide.is-active img')).toBeVisible();
    await expect(page.locator('.hero__nav')).toHaveCount(0);
  });
});
