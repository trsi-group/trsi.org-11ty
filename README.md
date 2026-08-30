<p align="center">
  <img src="src/public/img/trsi-logo.png" alt="TRSI" width="320">
</p>

<h1 align="center">trsi.org</h1>

<p align="center">
  The website of Tristar &amp; Red Sector Inc. — demos, intros, graphics, music<br>
  and news from a group that has been at it since 1990.
</p>

<p align="center">
  <a href="https://trsi.org">trsi.org</a> · built with
  <a href="https://www.11ty.dev/">Eleventy</a> · content from Contentful ·
  deployed on Netlify
</p>

---

## Getting started

Requires **Node 22+** and a Contentful token pair.

```bash
npm install
```

Create a `.env` in the project root:

```ini
NODE_ENV=development
DELIVERY_TOKEN=<from the Contentful space settings>
MANAGEMENT_TOKEN=<from the Contentful space settings>
```

Then:

```bash
npm start          # fetch content, build, and serve on localhost:8080
```

The first run downloads every asset from Contentful, so give it a minute.

## Working on it

| Command | What it does |
| --- | --- |
| `npm start` | Full build, then the dev server with watch |
| `npm run serve` | Eleventy only — reuses already-fetched content. The fast loop. |
| `npm run build` | Production build into `dist/` |
| `npm run build:content` | Refetch and reprocess Contentful, then verify URLs |
| `npm run build:css` | CSS only |

Where to change what:

- **Content** — in Contentful, then `npm run build:content`
- **Pages, styles, scripts** — `src/`; the dev server picks them up
- **How CMS fields become page data** — `cms/scripts/transform*.js`

One check runs as part of every content build: `npm run build:c-verify` fails if
a title change would retire a URL that has already been shared publicly. If it
complains, the fix is usually a stale export — refetch and try again.

## Learn more

- [`architecture.md`](./architecture.md) — how the pieces fit together
- [`cms/README.md`](./cms/README.md) — content integration details

## License

MIT — see [LICENSE](./LICENSE).

---

<p align="center"><em>the sleeping gods are back!</em></p>
