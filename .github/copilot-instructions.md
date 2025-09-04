# TRSI.org Copilot Instructions

## Architecture Overview

This is an **11ty (Eleventy) static site** for the TRSI demogroup that uses **Contentful CMS** as a headless backend. The build process fetches content from Contentful, transforms it into optimized JSON files, and generates a static site with Bulma CSS framework.

### Key Data Flow
1. **Content Fetch**: `npm run build:c-fetch` → Downloads content from Contentful to `cms/export/content.json`
2. **Content Transform**: `npm run build:c-process` → Transforms content via `cms/scripts/transform*.js` to `cms/data/*.json`  
3. **Static Generation**: `eleventy` → Generates site from `src/` using data from `cms/data/`

## Essential Workflows

### Development Commands
- `npm run start` - Full build + serve with watch mode
- `npm run serve` - Serve only (assumes content already processed)
- `npm run build:content` - Fetch and process CMS content only
- `npm run build:css` - Build optimized CSS with PostCSS/PurgeCSS

### Testing Commands
- `npm test` - Run all unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode during development
- `npm run test:coverage` - Generate test coverage reports
- `npm run test:e2e` - Run end-to-end tests with Playwright
- `npm run test:integration` - Run Eleventy build integration tests

### Content Management
- Content types: `productions`, `members`, `graphics`, `music`, `posts`
- Each has dedicated transform script in `cms/scripts/transform*.js`
- Images automatically converted to WebP and optimized via Sharp
- All CMS data available in Liquid templates via `cms.*` (e.g., `cms.productions`)

## Critical File Patterns

### Data Layer
- `src/_data/cms.js` - Exports all transformed CMS content to templates
- `src/_data/nav.js` - Navigation structure from `navdata.json`
- `src/_data/site.js` - Site metadata, domain, and environment config

### Templates (Liquid)
- `src/_includes/layouts/base.liquid` - Main layout with conditional CSS loading
- `src/_includes/components/` - Reusable components (cards, filters, modals)
- Page templates use `cms` data object: `{% for item in cms.productions %}`

### JavaScript Architecture
- **ES6 modules**: `src/js/main.js` (entry) imports from `src/js/utils.js`
- **Modal system**: Bulma-based modals with YouTube embed support
- **Filter system**: Client-side filtering for production/graphics feeds
- **URL parameters**: Check `main.js` for examples like `mode=wotw` feature flags

## Content Transform Patterns

### Transform Scripts Structure
All transform scripts in `cms/scripts/` follow this pattern:
```javascript
export function transformContentType(contentfulData) {
  const { entries, assets } = contentfulData;
  // Filter entries by content type
  // Map/transform fields
  // Resolve asset references to local WebP paths
  return transformedArray;
}
```

### Asset Handling
- Images downloaded to `cms/export/images.ctfassets.net/`
- Processed to `dist/img/` as WebP with multiple sizes
- References updated in JSON to point to local WebP files

## CSS Build System

### PostCSS Pipeline
- **Input**: `src/css/index.css` (imports Bulma + custom styles)
- **Output**: `dist/css/main.min.css` (production) or individual files (dev)
- **PurgeCSS**: Removes unused CSS based on Liquid/HTML/JS content
- **Safelist**: Preserves dynamic classes like `is-active`, `is-hidden`

### Theming
- Two themes: `first` and `joe` (controlled by `site.theme`)
- Theme-specific CSS loaded via `theme-${site.theme}.css`

## Testing Strategy

### Unit Tests (`tests/unit/`)
- **utils.test.js**: Modal system, filter functions, DOM interactions
- **transform.test.js**: Content transformation and data validation
- **development.test.js**: Development workflow and configuration validation

### Integration Tests (`tests/integration/`)
- **build.test.js**: Full Eleventy build process, HTML generation, asset copying

### E2E Tests (`tests/e2e/`)
- **app.test.js**: Browser interactions, navigation, modal behavior, mobile responsive
- Covers real user workflows: filtering, deep linking, accessibility

### Test Patterns
- Use `vitest` for fast unit/integration testing with jsdom
- Use `playwright` for cross-browser e2e testing
- Mock CMS data for consistent testing without API dependencies
- Test component isolation and integration with real DOM

## Environment Configuration

### Required ENV Variables
- `DELIVERY_TOKEN` - Contentful delivery API token
- `MANAGEMENT_TOKEN` - Contentful management API token
- `NODE_ENV` - Controls production optimizations

### Production vs Development
- **Production**: Minified CSS (`main.min.css`), optimized builds
- **Development**: Individual CSS files, faster builds, local domain

## Common Integration Points

### Adding New Content Types
1. Add to `cms/config.json` queryEntries
2. Create `cms/scripts/transformNewType.js` with tests
3. Add to `cms/scripts/processContent.js` transforms array
4. Create page template in `src/` using `cms.newType` data
5. Add unit tests for transform function and integration tests for page generation

### Modal System Usage
Cards with `js-modal-trigger` class auto-bind to modal system. Required data attributes:
- `data-slug`, `data-description`, `data-youtube`, `data-image`, etc.
- See `utils.js` `getDataFromCard()` for complete list
- Test modal interactions in `tests/unit/utils.test.js`

### Navigation Customization
- Edit `src/_data/navdata.json` for nav items
- Client-side visibility controlled in `main.js` (see `mode=wotw` example)
- Server-side filtering available in `nav.js` (currently unused)

### Debugging and Development
- Use `npm run debug` for Eleventy verbose logging
- Test URL parameters locally: `localhost:8080?mode=wotw`
- Check `tests/unit/development.test.js` for workflow validation patterns
- Use `npm run test:watch` during development for instant feedback
