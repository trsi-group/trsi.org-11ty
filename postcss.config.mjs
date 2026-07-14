import postcssImport from "postcss-import";
import autoprefixer from "autoprefixer";
import purgecssModule from "@fullhuman/postcss-purgecss";
import cssnano from "cssnano";

// Fix: Use `.default` to get the actual function
const purgecss = purgecssModule.default;

export default {
  plugins: [
    postcssImport,
    autoprefixer,
    purgecss({
      content: [
        "./src/**/*.liquid",
        "./src/**/*.html",
        "./src/**/*.md",
        "./src/**/*.js",
      ],
      defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: {
        standard: [
          // Bulma classes the modal still relies on
          "is-active", "is-hidden", "modal", "modal-background", "modal-content",
          "modal-close", "box", "button", "container", "image", "has-ratio",
          // Applied by JS, so PurgeCSS cannot see them in the templates
          "hero--enhanced", "is-current", "modal-open",
        ],
        greedy: [
          /^hero__/, /^music-card/, /^card__/, /^card-grid/, /^site-nav/,
          /^site-header/, /^site-footer/, /^social-links/, /^section-head/,
          /^section__/, /^article__/, /^navbar-burger/,
        ],
        // `variables: true` below strips custom properties PurgeCSS thinks are
        // unused. The design tokens must survive.
        variables: [
          /^--color-/, /^--font-/, /^--fs-/, /^--fw-/, /^--ls-/, /^--lh-/,
          /^--space-/, /^--container/, /^--gutter/, /^--grid-gap/, /^--section-pad/,
          /^--ratio-/, /^--dur/, /^--ease/,
        ],
      },
      variables: true,
    }),
    cssnano(),
  ],
};
