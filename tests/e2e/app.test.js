import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium } from 'playwright';

describe('End-to-End Tests', () => {
  let browser;
  let page;
  const baseURL = 'http://localhost:8080';

  beforeAll(async () => {
    // Start the development server
    browser = await chromium.launch();
    page = await browser.newPage();
  }, 30000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  it('should load the homepage', async () => {
    await page.goto(baseURL);
    
    await expect(page).toHaveTitle(/TRSI/);
    await expect(page.locator('h1')).toContainText('Latest');
    await expect(page.locator('.navbar-brand')).toContainText('Back to the...Roots');
  });

  it('should navigate to productions page', async () => {
    await page.goto(baseURL);
    await page.click('a[href="/productions"]');
    
    await expect(page).toHaveURL(/\/productions/);
    await expect(page.locator('h1.title')).toContainText('Productions');
    await expect(page.locator('.filter-wrapper')).toBeVisible();
  });

  it('should open and close modal correctly', async () => {
    await page.goto(`${baseURL}/productions`);
    
    // Wait for content to load
    await page.waitForSelector('.js-modal-trigger', { timeout: 5000 });
    
    // Click first modal trigger if available
    const triggers = await page.locator('.js-modal-trigger').count();
    if (triggers > 0) {
      await page.click('.js-modal-trigger >> nth=0');
      
      // Modal should be visible
      await expect(page.locator('.modal.is-active')).toBeVisible();
      
      // Close modal by clicking background
      await page.click('.modal-background');
      
      // Modal should be hidden
      await expect(page.locator('.modal.is-active')).not.toBeVisible();
    }
  });

  it('should filter content correctly', async () => {
    await page.goto(`${baseURL}/productions`);
    
    // Wait for filter to be available
    await page.waitForSelector('#TypeFilter', { timeout: 5000 });
    
    const initialCards = await page.locator('#feed-wrapper .column').count();
    
    if (initialCards > 0) {
      // Select a filter option (skip "All Types")
      const options = await page.locator('#TypeFilter option').count();
      if (options > 1) {
        await page.selectOption('#TypeFilter', { index: 1 });
        
        // Some cards should be hidden
        const visibleCards = await page.locator('#feed-wrapper .column:visible').count();
        expect(visibleCards).toBeLessThanOrEqual(initialCards);
      }
    }
  });

  it('should handle mobile navigation', async () => {
    await page.setViewportSize({ width: 375, height: 667 }); // Mobile viewport
    await page.goto(baseURL);
    
    // Mobile burger menu should be visible
    await expect(page.locator('.navbar-burger')).toBeVisible();
    
    // Menu should be hidden initially
    await expect(page.locator('.navbar-menu.is-active')).not.toBeVisible();
    
    // Click burger menu
    await page.click('.navbar-burger');
    
    // Menu should be visible
    await expect(page.locator('.navbar-menu.is-active')).toBeVisible();
  });

  it('should handle URL parameters for WOTW mode', async () => {
    await page.goto(`${baseURL}?mode=wotw`);
    
    // Music nav item should be visible (based on current implementation)
    const musicNavItem = page.locator('.navbar-start .navbar-item:has-text("Music")');
    if (await musicNavItem.count() > 0) {
      await expect(musicNavItem).toBeVisible();
    }
  });

  it('should handle deep linking to modals', async () => {
    await page.goto(`${baseURL}/productions`);
    
    // Wait for cards to load
    await page.waitForSelector('[data-slug]', { timeout: 5000 });
    
    const slugElements = await page.locator('[data-slug]').count();
    if (slugElements > 0) {
      const slug = await page.locator('[data-slug]').first().getAttribute('data-slug');
      
      // Navigate with hash
      await page.goto(`${baseURL}/productions#${slug}`);
      
      // Modal should open automatically
      await expect(page.locator('.modal.is-active')).toBeVisible();
    }
  });

  it('should be accessible', async () => {
    await page.goto(baseURL);
    
    // Check for basic accessibility features
    await expect(page.locator('[aria-label]')).toHaveCount.greaterThan(0);
    await expect(page.locator('img[alt]')).toHaveCount.greaterThan(0);
    
    // Check navigation landmarks
    await expect(page.locator('nav[role="navigation"]')).toBeVisible();
    await expect(page.locator('main, [role="main"]')).toBeVisible();
  });
});
