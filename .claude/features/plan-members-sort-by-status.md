# Plan: Sort Members by Status

Add a client-side sort dropdown to the members page with two modes:

1. **A–Z** (default) — alphabetical by handle, matching today's behavior.
2. **Status** — grouped in this fixed order: `active`, `inactive`, `in Valhalla`, `Lost in Mission`. Within each status group, handles sort alphabetically.

Approach mirrors the existing filter pattern on productions/graphics/music: a Bulma `<select>` rendered via a small component, wired through a handler in `utils.js` and registered in `main.js`. Sorting happens client-side via DOM reordering; the build-time alphabetical sort stays as the no-JS fallback.

The status-to-rank mapping lives in JS (not in the content transform), so re-ordering later is a one-line edit with no content rebuild.

---

## Progress Tracker

- [x] **Step 1** — Emit `data-status` and `data-sort-handle` on card columns in `feed-cards.liquid`
- [x] **Step 2** — Create new `feed-sort.liquid` component with the two-option dropdown
- [x] **Step 3** — Wire the sort dropdown into `members.liquid` (`.filter-wrapper` + `#feed-wrapper`)
- [x] **Step 4** — Add `STATUS_RANK` + `handleSortChange` in `utils.js`
- [x] **Step 5** — Register the `change` listener for `#SortSelect` in `main.js`
- [ ] **Step 6** — Manual verification in the browser (default A–Z, switch to Status, verify tie-break within status groups, confirm productions/graphics/music unaffected)

---

## Step 1 — `feed-cards.liquid`

Add two data attributes to the `.column` wrapper. Empty values on non-member feeds are harmless.

```liquid
<div class="column is-one-third"
  data-type="{{ item.type | downcase }}"
  data-date="{{ item.release_date }}"
  data-platform="{{ item.platform | downcase }}"
  data-status="{{ item.member_status | downcase }}"
  data-sort-handle="{{ item.sort_handle }}">
```

`sort_handle` is already produced by `cms/scripts/transformMembers.js` (lowercased handle).

## Step 2 — `src/_includes/components/feed-sort.liquid` (new)

```liquid
<div class="select is-small is-rounded is-primary">
  <select aria-label="Sort members" id="SortSelect">
    <option value="handle">A–Z</option>
    <option value="status">Status</option>
  </select>
</div>
```

## Step 3 — `src/members.liquid`

Wrap the feed in `#feed-wrapper` (the JS sort handler scopes its query to this id) and render the sort component in `.filter-wrapper`.

```liquid
<section class="section">
  <div class="content">
    <h1 class="title">Members</h1>
  </div>
  <div class="filter-wrapper">
    {%- render "components/feed-sort.liquid" %}
  </div>
  <div id="feed-wrapper">
    {%- render "components/feed-cards.liquid", feed: cms.members, type: "members", sort_key: "sort_handle", sort_order: "asc" %}
  </div>
</section>
```

## Step 4 — `src/js/utils.js`

Add the rank map and handler. Unknown statuses fall to the bottom via `?? 99`, then sort alphabetically among themselves.

```js
const STATUS_RANK = {
  'active': 0,
  'inactive': 1,
  'in valhalla': 2,
  'lost in mission': 3,
};

export function handleSortChange(event) {
  const wrapper = document.querySelector('#feed-wrapper .columns');
  if (!wrapper) return;

  const cards = Array.from(wrapper.querySelectorAll(':scope > .column'));
  const mode = event.target.value;

  const byHandle = (a, b) =>
    (a.dataset.sortHandle || '').localeCompare(b.dataset.sortHandle || '');

  const byStatus = (a, b) => {
    const ra = STATUS_RANK[a.dataset.status] ?? 99;
    const rb = STATUS_RANK[b.dataset.status] ?? 99;
    if (ra !== rb) return ra - rb;
    return byHandle(a, b);
  };

  cards.sort(mode === 'status' ? byStatus : byHandle);
  cards.forEach(c => wrapper.appendChild(c));
}
```

## Step 5 — `src/js/main.js`

Import and register alongside the existing filter listeners.

```js
import { /* …existing…, */ handleSortChange } from './utils.js';

const sortSelect = document.getElementById("SortSelect");
if (sortSelect) sortSelect.addEventListener("change", handleSortChange);
```

---

## Notes

- **No transform / content rebuild required.** `member_status` is reused as-is; the rank map lives in JS.
- **No-JS fallback:** build-time sort by `sort_handle` still renders A–Z.
- **Blast radius:** `feed-cards.liquid` gains two data attributes (harmless on other pages). Everything else is additive. No PurgeCSS changes — no new classes introduced.
- **Status values observed in `cms/data/members.json`:** `active`, `inactive`, `in Valhalla`, `Lost in Mission`. All four are covered by `STATUS_RANK` (lowercased keys, since `data-status` is lowercased).
- **Naming:** `SortSelect` avoids the `XxxFilter` id convention used by filters, making it obvious in JS which element is which.
