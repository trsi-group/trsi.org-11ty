import path from 'path';

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
      const imageId = fields.avatar?.['en-US']?.sys.id;

      return {
        title: fields.title['en-US'],
        body: fields.body?.['en-US'],
        publishDate: fields.publishDate?.['en-US'],
      };
    });
  // console.log("posts: " + JSON.stringify(posts, null, 2));

  return { posts };
}

// Export for module usage
export const name = 'transformPosts'
