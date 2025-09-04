import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const execAsync = promisify(exec);

describe('Eleventy Build Integration', () => {
  const distDir = resolve(process.cwd(), 'dist');
  const mockDataDir = resolve(process.cwd(), 'tests/fixtures');

  beforeAll(async () => {
    // Create mock CMS data for testing
    const mockProductions = {
      productions: [
        {
          title: 'Test Production',
          slug: 'test-production',
          description: 'A test production for integration testing',
          release_date: '2024-01-01',
          type: 'Demo',
          platform: 'Amiga',
          image: '/img/test.webp',
          youtube: 'https://www.youtube-nocookie.com/embed/test',
          credits: [{ name: 'Test User', contribution: 'Code' }],
          tags: ['demo', 'amiga']
        }
      ]
    };

    // Ensure mock data directory exists and write test data
    await execAsync('mkdir -p cms/data');
    await execAsync(`echo '${JSON.stringify(mockProductions)}' > cms/data/productions.json`);
    await execAsync(`echo '{"graphics":[]}' > cms/data/graphics.json`);
    await execAsync(`echo '{"music":[]}' > cms/data/music.json`);
    await execAsync(`echo '{"members":[]}' > cms/data/members.json`);
    await execAsync(`echo '{"posts":[]}' > cms/data/posts.json`);
  }, 30000);

  afterAll(async () => {
    // Clean up test files
    await execAsync('rm -rf dist');
  });

  it('should build the site successfully', async () => {
    const { stdout, stderr } = await execAsync('npm run build:css && npx eleventy');
    
    expect(stderr).toBe('');
    expect(stdout).toContain('Wrote');
    expect(existsSync(resolve(distDir, 'index.html'))).toBe(true);
  }, 30000);

  it('should generate all required pages', async () => {
    await execAsync('npm run build:css && npx eleventy');
    
    const requiredPages = [
      'index.html',
      'productions/index.html',
      'graphics/index.html',
      'music/index.html',
      'members/index.html',
      'news/index.html',
      'about/index.html'
    ];

    requiredPages.forEach(page => {
      const pagePath = resolve(distDir, page);
      expect(existsSync(pagePath)).toBe(true);
    });
  }, 30000);

  it('should include CMS data in generated pages', async () => {
    await execAsync('npm run build:css && npx eleventy');
    
    const productionsHtml = readFileSync(resolve(distDir, 'productions/index.html'), 'utf-8');
    
    // Should contain the test production data
    expect(productionsHtml).toContain('Test Production');
    expect(productionsHtml).toContain('test-production');
    expect(productionsHtml).toContain('A test production for integration testing');
  }, 30000);

  it('should copy static assets correctly', async () => {
    await execAsync('npm run build:css && npx eleventy');
    
    const staticAssets = [
      'js/main.js',
      'js/utils.js',
      'css/index.css',
      'css/styles.css',
      'fonts/edit-undo-brk-v2.woff2',
      'img/trsi-logo.png'
    ];

    staticAssets.forEach(asset => {
      const assetPath = resolve(distDir, asset);
      expect(existsSync(assetPath)).toBe(true);
    });
  }, 30000);

  it('should generate valid HTML structure', async () => {
    await execAsync('npm run build:css && npx eleventy');
    
    const indexHtml = readFileSync(resolve(distDir, 'index.html'), 'utf-8');
    
    // Check basic HTML structure
    expect(indexHtml).toContain('<!DOCTYPE html>');
    expect(indexHtml).toContain('<html lang="en"');
    expect(indexHtml).toContain('<title>');
    expect(indexHtml).toContain('<meta charset="utf-8">');
    expect(indexHtml).toContain('<meta name="viewport"');
    
    // Check navigation structure
    expect(indexHtml).toContain('navbar');
    expect(indexHtml).toContain('Productions');
    expect(indexHtml).toContain('Graphics');
    expect(indexHtml).toContain('Music');
    expect(indexHtml).toContain('Members');
    
    // Check modal structure
    expect(indexHtml).toContain('modal');
    expect(indexHtml).toContain('js-modal-trigger');
  }, 30000);

  it('should include required meta tags and SEO elements', async () => {
    await execAsync('npm run build:css && npx eleventy');
    
    const indexHtml = readFileSync(resolve(distDir, 'index.html'), 'utf-8');
    
    // Check SEO meta tags
    expect(indexHtml).toContain('<meta name="description"');
    expect(indexHtml).toContain('<meta name="keywords"');
    expect(indexHtml).toContain('<link rel="canonical"');
    
    // Check Open Graph tags
    expect(indexHtml).toContain('og:title');
    expect(indexHtml).toContain('og:description');
    expect(indexHtml).toContain('og:image');
    
    // Check structured data
    expect(indexHtml).toContain('application/ld+json');
  }, 30000);
});
