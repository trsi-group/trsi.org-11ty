import { buildImageIndex, imagePath } from './assetPaths.js';

/**
 * Transforms Contentful JSON export to the target simplified format.
 * @param {Object} contentfulData - The raw JSON data exported from Contentful.
 * @returns {Object} The transformed JSON.
 */
export function transformMembers(contentfulData) {
  const { entries, assets } = contentfulData;

  const index = buildImageIndex(assets);

  const members = entries
    .filter((entry) => entry.sys.contentType.sys.id === 'member')
    .map((entry) => {
      const fields = entry.fields;
      const imageId = fields.avatar?.['en-US']?.sys.id;

      return {
        handle: fields.handle['en-US'],
        real_name: fields.realName?.['en-US'],
        card_image: imageId ? imagePath(index, imageId, 'card') : null,
        member_since: fields.memberSince ? fields.memberSince['en-US'] : null,
        member_status: fields.memberStatus ? fields.memberStatus['en-US'] : null,
        sort_handle: fields.handle['en-US'].toLowerCase(),
      };
    });

  return { members };
}

// Export for module usage
export const name = 'transformMembers'
