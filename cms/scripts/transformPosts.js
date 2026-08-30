import { buildImageIndex, imagePath, imageSize, localiseAssetUrls } from './assetPaths.js';
import { postSlug } from './slug.js';

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
      const slug = postSlug(fields.title['en-US']);
      const body = fields.body?.['en-US'];
      const socialSize = imageId ? imageSize(index, imageId) : null;

      return {
        title: fields.title['en-US'],
        teaser: fields.teaser?.['en-US'],
        body: body ? localiseAssetUrls(index, body, 'card') : body,
        post_image: imageId ? imagePath(index, imageId, 'card') : null,
        // Social previews need the uploaded resolution, which 'card' caps at 800px wide
        social_image: imageId ? imagePath(index, imageId, 'orig') : null,
        social_image_width: socialSize ? socialSize.width : null,
        social_image_height: socialSize ? socialSize.height : null,
        publishDate: fields.publishDate?.['en-US'],
        author: fields.author?.['en-US'] ?? null,
        slug: slug,
      };
    });
  // console.log("posts: " + JSON.stringify(posts, null, 2));

  return { posts };
}

// Export for module usage
export const name = 'transformPosts'
