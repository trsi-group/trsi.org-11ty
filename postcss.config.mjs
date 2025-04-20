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
      defaultExtractor: (content) => content.match(/[\w-/:]+(?<!:)/g) || [], // Extracts Tailwind/Bulma-style classes
      safelist: {
        standard: [
          "is-active", "has-text-centered", "has-text-right", "is-hidden",
          "navbar", "menu", "hero", "button", "card", "container",
          "columns", "column", "icon"
        ]
      },
      variables: true, // remove unused CSS variables
    }),
    cssnano(),
  ],
};