import { beforeEach, expect } from 'vitest';

// Extend expect with jest-dom matchers
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// Mock browser APIs that aren't available in jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock scrollTo for modal tests
global.scrollTo = (x, y) => {
  window.scrollX = x;
  window.scrollY = y;
};

// Mock URLSearchParams for older environments
if (!global.URLSearchParams) {
  global.URLSearchParams = class URLSearchParams {
    constructor(search = '') {
      this.params = new Map();
      if (search.startsWith('?')) search = search.slice(1);
      search.split('&').forEach(param => {
        const [key, value] = param.split('=');
        if (key) this.params.set(decodeURIComponent(key), decodeURIComponent(value || ''));
      });
    }
    get(key) { return this.params.get(key); }
    set(key, value) { this.params.set(key, value); }
    has(key) { return this.params.has(key); }
  };
}

// Reset DOM before each test
beforeEach(() => {
  document.body.innerHTML = '';
  document.head.innerHTML = '';
  window.location.hash = '';
});
