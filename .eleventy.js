import eleventyPluginMarkdown from "@jgarber/eleventy-plugin-markdown";
import { displayDate, isoDate } from "./src/_filters/dates.js";

export default function(eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setOutputDirectory("dist");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/uade");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy({ "src/public": "." });
  eleventyConfig.addPassthroughCopy({ "cms/data": "/data" });
  eleventyConfig.addWatchTarget("**/*.(png|jpeg|webp|js)");

  eleventyConfig.addFilter("displayDate", displayDate);
  eleventyConfig.addFilter("isoDate", isoDate);

  // Add Markdown plugin
  eleventyConfig.addPlugin(eleventyPluginMarkdown);
};