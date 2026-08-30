import postcssImport from "postcss-import";
import autoprefixer from "autoprefixer";
import purgecssModule from "@fullhuman/postcss-purgecss";
import cssnano from "cssnano";

// v7 wrapped the plugin one level deeper than v8 exports it.
const purgecss = purgecssModule.default ?? purgecssModule;

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
      // Extracts Bulma-style classes
      defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: {
        standard: ["is-active", "is-hidden", "is-open"]
      },
      // remove unused CSS variables
      variables: true,
    }),
    cssnano(),
  ],
};