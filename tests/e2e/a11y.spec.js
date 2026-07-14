import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ROUTES = ['/', '/news/', '/productions/', '/graphics/', '/music/', '/members/', '/about/'];

for (const route of ROUTES) {
  test(`${route} has no serious or critical accessibility violations`, async ({ page }) => {
    await page.goto(route);

    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

    expect(
      blocking,
      blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`).join('\n'),
    ).toEqual([]);
  });
}

test('the skip link is the first element in the DOM and reveals itself on focus', async ({ page }) => {
  // Asserted via focus() rather than Tab: WebKit does not move focus to links on
  // Tab unless full keyboard access is enabled.
  await page.goto('/');

  const skip = page.locator('.skip-link');
  await expect(skip).toHaveAttribute('href', '#main');

  const offscreenTop = await skip.evaluate((el) => el.getBoundingClientRect().top);
  await skip.focus();
  const focusedTop = await skip.evaluate((el) => el.getBoundingClientRect().top);

  expect(offscreenTop).toBeLessThan(0);
  expect(focusedTop).toBeGreaterThanOrEqual(0);
});

test('focus is visible on the card title button', async ({ page }) => {
  await page.goto('/productions/');

  const title = page.locator('.card.pointer .card__open').first();
  await title.focus();

  const outline = await title.evaluate((el) => getComputedStyle(el).outlineWidth);
  expect(outline).not.toBe('0px');
});
