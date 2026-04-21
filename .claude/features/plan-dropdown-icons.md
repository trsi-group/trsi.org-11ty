# Plan: Icons on Filter & Sort Dropdowns

Disambiguate the two dropdown types (filter vs. sort) by placing a small pixel-art icon next to each `<select>`:

- **Filter icon** (funnel with stem) → `feed-filter.liquid` (used on productions, graphics, music)
- **Sort icon** (funnel-top / stacked chevron) → `feed-sort.liquid` (used on members; may be reused elsewhere later)

Icons live at `src/icons/sort.svg` and `src/icons/filter.svg`, use `fill="currentColor"` so they inherit the theme color through CSS variables, and are inlined via Liquid `{%- include %}` (same pattern as `icons/instagram.svg`, `icons/play-button.svg`, etc.).

---

## Progress Tracker

- [x] **Step 1** — Recreate both icons as SVG in `src/icons/` (pixel-art style, `currentColor` fill)
- [x] **Step 2** — Update `feed-filter.liquid` to prepend the filter icon next to the select
- [x] **Step 3** — Update `feed-sort.liquid` to prepend the sort icon next to the select
- [x] **Step 4** — Add `.filter-wrapper .filter-item` CSS for icon+select layout (inline-flex, gap, icon sizing)
- [ ] **Step 5** — Manual browser verification on `/members/`, `/productions/`, `/graphics/`, `/music/` — desktop + mobile, light + dark theme

---

## Step 2 — `feed-filter.liquid`

Wrap the existing `.select` in a small flex container and prepend the inline SVG:

```liquid
<div class="filter-item">
  <span class="filter-item-icon">{%- include "icons/filter.svg" %}</span>
  <div class="select is-small is-rounded is-primary">
    <select aria-label="{{ type }} Filter" id="{{ type }}Filter">
      <option value="">All {{ type }}s</option>
      {%- for key in sorted_keys %}
        {%- if key %}
      <option value="{{ key | downcase }}">{{ key }}</option>
        {%- endif %}
      {%- endfor %}
    </select>
  </div>
</div>
```

## Step 3 — `feed-sort.liquid`

Same wrapper, different icon:

```liquid
<div class="filter-item">
  <span class="filter-item-icon">{%- include "icons/sort.svg" %}</span>
  <div class="select is-small is-rounded is-primary">
    <select aria-label="Sort members" id="SortSelect">
      <option value="handle">A–Z</option>
      <option value="status">Status</option>
    </select>
  </div>
</div>
```

## Step 4 — CSS (`src/css/styles.css`)

Extend the existing `/* Filter */` block. `.filter-wrapper` already has `margin-bottom: 1rem`; add the new child rules below it:

```css
.filter-wrapper .filter-item {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: 1rem;
  color: var(--text-color);
}

.filter-wrapper .filter-item-icon {
  display: inline-flex;
  line-height: 0;
}

.filter-wrapper .filter-item-icon svg {
  width: 1.25rem;
  height: 1.25rem;
  fill: currentColor;
}
```

`currentColor` on the SVGs means they automatically track `--text-color` and stay correct across both themes.

## Step 5 — Verification

- `/members/` — sort icon appears left of the A–Z/Status dropdown.
- `/productions/`, `/graphics/`, `/music/` — filter icon appears left of each of the two dropdowns.
- Desktop: icons sit inline, dropdowns don't wrap unless viewport forces it.
- Mobile: icon+select pairs stay together when they wrap (the `.filter-item` wrapper keeps the icon attached to its select).
- Both themes render icons in the correct color (no hardcoded black).

---

## Notes

- **Why not Bulma's `.control.has-icons-left`?** That pattern places the icon absolutely positioned inside the select's padding area. It adds PurgeCSS safelist needs (`has-icons-left`, `is-left`) and tangles with the custom `.select select` border/padding already set in `styles.css`. A plain flex wrapper is simpler and keeps existing styles untouched.
- **Accessibility:** SVGs carry `aria-hidden="true"`. The semantic meaning is on the `<select aria-label>`, so the icons are purely visual.
- **No JS changes.** IDs and event wiring stay the same.
- **Blast radius:** `feed-filter.liquid` and `feed-sort.liquid` gain one extra element each; `.filter-item*` classes are new (scoped under `.filter-wrapper`, so no risk of colliding with existing selectors). No changes to content pipeline.
