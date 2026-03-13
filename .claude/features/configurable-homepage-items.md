# Plan: Configurable Homepage News Items + Bug Fix

## The Bug

In `src/_includes/components/feed-news.liquid`, the `max` parameter is **silently ignored**. All posts are always displayed regardless of the `max: 3` passed from `index.liquid`.

### Root Cause

```liquid
{%- assign items = max | default: feed.size %}
{%- assign sliced_feed = feed | slice: 0, items %}        ← slices UNSORTED feed
{%- assign sorted_feed = feed | sort: "publishDate" | reverse %}  ← sorts FULL feed
      <div class="posts">
        {%- for item in sorted_feed %}                     ← iterates SORTED (full) feed
```

Two problems:
1. **`sliced_feed` is computed but never used** — the loop iterates over `sorted_feed` which contains ALL items
2. **Slice happens before sort** — even if `sliced_feed` were used, it would slice the unsorted feed, giving random items instead of the most recent ones

Compare with `feed-cards.liquid` which does this correctly: sort first, then slice, then iterate the sliced result.

---

## Implementation Plan

### Step 1: Add `homepage` config to `site.js`

Add a `homepage` configuration object to `src/_data/site.js` that controls how many items appear in each homepage section:

```js
// src/_data/site.js

const homepage = {
  newsItems: 3,
  productionItems: 3,
  graphicsItems: 3,
};

export default {
  metadata,
  domain,
  theme,
  prodenv,
  homepage,
};
```

This centralizes all homepage display limits in one place instead of hardcoding them in the template.

### Step 2: Fix `feed-news.liquid`

Fix the bug by sorting first, then slicing, then iterating the sliced result:

```liquid
{%- assign items = max | default: feed.size %}
{%- assign sorted_feed = feed | sort: "publishDate" | reverse %}
{%- assign sliced_feed = sorted_feed | slice: 0, items %}
      <div class="posts">
        {%- for item in sliced_feed %}
        <div class="columns">
          ...
        {%- endfor %}
      </div>
```

Changes from current code:
- Sort happens **before** slice (gets newest items, not random ones)
- Loop iterates `sliced_feed` (respects the `max` limit)
- Removed the unused `sliced_feed` line that operated on unsorted data

### Step 3: Update `index.liquid` to use `site.homepage` config

Replace the hardcoded `max: 3` values with the centralized config:

```liquid
<section class="section">
  <div class="content">
    <h1><a href="/news/">Latest News</a></h1>
  </div>
  {%- render "components/feed-news.liquid", feed: cms.posts, max: site.homepage.newsItems %}
</section>

<section class="section">
  <div class="content">
    <h1><a href="/productions/">Latest Productions</a></h1>
  </div>
  {%- render "components/feed-cards.liquid", feed: cms.productions, type: "productions", max: site.homepage.productionItems %}
</section>

<section class="section">
  <div class="content">
    <h1><a href="/graphics/">Latest Graphics</a></h1>
  </div>
  {%- render "components/feed-cards.liquid", feed: cms.graphics, type: "graphics", max: site.homepage.graphicsItems %}
</section>
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/_data/site.js` | Add `homepage` config object with item counts |
| `src/_includes/components/feed-news.liquid` | Fix sort-before-slice bug, iterate sliced result |
| `src/index.liquid` | Reference `site.homepage.*` instead of hardcoded `max: 3` |

---

## Todo List

### Phase 1: Bug Fix — `feed-news.liquid`

- [x] **1.1** Fix sort order: move `sort: "publishDate" | reverse` to execute **before** the slice
- [x] **1.2** Fix slice target: apply `slice: 0, items` to the **sorted** feed, not the raw feed
- [x] **1.3** Fix loop variable: change `for item in sorted_feed` → `for item in sliced_feed`
- [x] **1.4** Remove the now-redundant intermediate `sliced_feed` assignment on the unsorted data
- [x] **1.5** Manually verify: run `npm run serve`, confirm homepage shows exactly 3 news items (the 3 most recent by `publishDate`)

### Phase 2: Centralize Config — `site.js`

- [x] **2.1** Define `homepage` object with `newsItems: 3`, `productionItems: 3`, `graphicsItems: 3`
- [x] **2.2** Add `homepage` to the `export default` block
- [x] **2.3** Verify `site.homepage` is accessible in templates by inspecting rendered output or adding a temporary debug line

### Phase 3: Wire Up Config — `index.liquid`

- [x] **3.1** Replace `max: 3` on the `feed-news.liquid` render with `max: site.homepage.newsItems`
- [x] **3.2** Replace `max: 3` on the `feed-cards.liquid` (productions) render with `max: site.homepage.productionItems`
- [x] **3.3** Replace `max: 3` on the `feed-cards.liquid` (graphics) render with `max: site.homepage.graphicsItems`

### Phase 4: Validation & Testing

- [x] **4.1** Set `newsItems: 2` in `site.js` → confirm only 2 news posts appear on homepage
- [x] **4.2** Set `newsItems: 5` → confirm 5 appear (or all if fewer than 5 exist)
- [x] **4.3** Remove `newsItems` from config entirely → confirm all posts appear (default fallback via `feed.size`)
- [x] **4.4** Verify the displayed news items are the **most recent** by `publishDate`, not random/unsorted
- [x] **4.5** Change `productionItems` and `graphicsItems` to different values → confirm those sections respect limits independently
- [x] **4.6** Navigate to `/news/` (full feed page) → confirm it is unaffected and still shows all posts
- [x] **4.7** Navigate to `/productions/` and `/graphics/` → confirm full feed pages are unaffected
- [x] **4.8** Restore `site.js` to desired defaults (`newsItems: 3`, `productionItems: 3`, `graphicsItems: 3`)

### Phase 5: Commit & PR

- [x] **5.1** Review all changed files: `site.js`, `feed-news.liquid`, `index.liquid`
- [x] **5.2** Commit with descriptive message explaining both the bug fix and the new config feature
- [ ] **5.3** Push branch and open PR
