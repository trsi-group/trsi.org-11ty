import { buildImageIndex, imagePath, localiseAssetUrls } from './assetPaths.js';

// Generate slug from title 
function getSlug(title) {
  return title
    .toLowerCase() // Convert to lowercase
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, ""); // Remove special characters
}

/**
 * Transforms Contentful JSON export to the target simplified format.
 * @param {Object} contentfulData - The raw JSON data exported from Contentful.
 * @returns {Object} The transformed JSON.
 */
export function transformPosts(contentfulData) {
  const { entries, assets } = contentfulData;

  const index = buildImageIndex(assets);

  const posts = entries
    .filter((entry) => entry.sys.contentType.sys.id === 'posts')
    .map((entry) => {
      const fields = entry.fields;
      const imageId = fields.image?.['en-US']?.sys.id;
      const slug = getSlug(fields.title['en-US']);
      const body = fields.body?.['en-US'];

      return {
        title: fields.title['en-US'],
        teaser: fields.teaser?.['en-US'],
        body: body ? localiseAssetUrls(index, body, 'card') : body,
        post_image: imageId ? imagePath(index, imageId, 'card') : null,
        publishDate: fields.publishDate?.['en-US'],
        slug: slug,
      };
    });
  // console.log("posts: " + JSON.stringify(posts, null, 2));

  return { posts };
}

// Export for module usage
export const name = 'transformPosts'
