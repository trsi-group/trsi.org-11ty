import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/js/musicPlayer.js', () => ({
  musicPlayerManager: {
    stop: vi.fn(), isPlaying: vi.fn(() => false), getCurrentTrack: vi.fn(() => null),
    loadAndPlay: vi.fn(), togglePlayback: vi.fn(), onStateChange: vi.fn(),
    onError: vi.fn(), onTrackEnd: vi.fn(), preload: vi.fn(),
  },
}));

const { handleFilterChange, handleSortChange } = await import('../../src/js/utils.js');

const feed = (items) => {
  document.body.innerHTML = `
    <select id="TypeFilter"><option value="" selected></option></select>
    <select id="PlatformFilter"><option value="" selected></option></select>
    <div id="feed-wrapper">
      <div class="card-grid">
        ${items.map((i) => `<div class="card-grid__item" data-type="${i.type}" data-platform="${i.platform}"></div>`).join('')}
      </div>
    </div>`;
};

const setSelect = (id, value) => {
  const select = /** @type {HTMLSelectElement} */ (document.getElementById(id));
  select.innerHTML = `<option value="${value}" selected></option>`;
};

const visibility = () =>
  Array.from(document.querySelectorAll('.card-grid__item')).map(
    (el) => /** @type {HTMLElement} */ (el).style.display,
  );

describe('handleFilterChange', () => {
  it('filters the CSS-grid wrappers that replaced Bulma columns', () => {
    feed([
      { type: 'demo', platform: 'amiga ocs' },
      { type: 'intro', platform: 'c64' },
    ]);
    setSelect('TypeFilter', 'demo');

    handleFilterChange();

    expect(visibility()).toEqual(['', 'none']);
  });

  it('ANDs type and platform together', () => {
    feed([
      { type: 'demo', platform: 'amiga ocs' },
      { type: 'demo', platform: 'c64' },
      { type: 'intro', platform: 'c64' },
    ]);
    setSelect('TypeFilter', 'demo');
    setSelect('PlatformFilter', 'c64');

    handleFilterChange();

    expect(visibility()).toEqual(['none', '', 'none']);
  });

  it('shows everything when no filter is selected', () => {
    feed([{ type: 'demo', platform: 'c64' }, { type: 'intro', platform: 'pc' }]);
    handleFilterChange();
    expect(visibility()).toEqual(['', '']);
  });

  it('does not throw on a page that renders no filter selects', () => {
    // The members page has a sort control and no filters. Reading .value on a
    // missing select used to throw a TypeError.
    document.body.innerHTML = `<div id="feed-wrapper"><div class="card-grid"></div></div>`;
    expect(() => handleFilterChange()).not.toThrow();
  });
});

describe('handleSortChange', () => {
  const members = () => {
    document.body.innerHTML = `
      <select id="SortSelect">
        <option value="handle">A–Z</option>
        <option value="status">Status</option>
      </select>
      <div id="feed-wrapper">
        <div class="card-grid">
          <div class="card-grid__item" data-sort-handle="zarch" data-status="active"></div>
          <div class="card-grid__item" data-sort-handle="madison" data-status="in valhalla"></div>
          <div class="card-grid__item" data-sort-handle="elko" data-status="inactive"></div>
        </div>
      </div>`;
    document.getElementById('SortSelect').addEventListener('change', handleSortChange);
  };

  const sortBy = (value) => {
    const select = /** @type {HTMLSelectElement} */ (document.getElementById('SortSelect'));
    select.value = value;
    select.dispatchEvent(new Event('change'));
  };

  const order = () =>
    Array.from(document.querySelectorAll('.card-grid__item')).map(
      (el) => /** @type {HTMLElement} */ (el).dataset.sortHandle,
    );

  it('sorts alphabetically by handle', () => {
    members();
    sortBy('handle');
    expect(order()).toEqual(['elko', 'madison', 'zarch']);
  });

  it('sorts by member status rank, then handle', () => {
    members();
    sortBy('status');
    expect(order()).toEqual(['zarch', 'elko', 'madison']);
  });

  it('keeps the cards as direct children of .card-grid', () => {
    // The sort re-appends into .card-grid; an extra wrapper would break it.
    members();
    sortBy('handle');

    const grid = document.querySelector('.card-grid');
    expect(grid.children).toHaveLength(3);
    Array.from(grid.children).forEach((child) => {
      expect(child.classList.contains('card-grid__item')).toBe(true);
    });
  });
});
