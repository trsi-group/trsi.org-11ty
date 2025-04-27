import eleventyPluginMarkdown from "@jgarber/eleventy-plugin-markdown";

export default function(eleventyConfig) {
  eleventyConfig.setInputDirectory("src");
  eleventyConfig.setOutputDirectory("dist");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy({ "src/public": "." });
  eleventyConfig.addPassthroughCopy({ "cms/data": "/data" });
  eleventyConfig.addWatchTarget("**/*.(png|jpeg|webp|js)");

  // Add Markdown plugin
  eleventyConfig.addPlugin(eleventyPluginMarkdown);
};