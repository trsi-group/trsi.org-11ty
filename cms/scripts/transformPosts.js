import { resolve } from 'path';

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

  // Helper to find asset by ID and resolve the local path
  const findAssetPathById = (assetId) => {
    const asset = assets.find((a) => a.sys.id === assetId);
    if (asset && asset.fields.file && asset.fields.file['en-US']) {
      return asset.fields.file['en-US'].fileName.replace(/\.[^/.]+$/, ".webp");
    }
    return null;
  };

  const posts = entries
    .filter((entry) => entry.sys.contentType.sys.id === 'posts')
    .map((entry) => {
      const fields = entry.fields;
      const imageId = fields.image?.['en-US']?.sys.id;
      const slug = getSlug(fields.title['en-US']);

      return {
        title: fields.title['en-US'],
        body: fields.body?.['en-US'],
        card_image: imageId ? resolve('/img/card/', findAssetPathById(imageId)) : null,
        image: imageId ? resolve('/img/orig/', findAssetPathById(imageId)) : null,
        publishDate: fields.publishDate?.['en-US'],
        slug: slug,
      };
    });
  // console.log("posts: " + JSON.stringify(posts, null, 2));

  return { posts };
}

// Export for module usage
export const name = 'transformPosts'
