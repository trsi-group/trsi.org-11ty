import { buildImageIndex, imagePath } from './assetPaths.js';

/**
 * Transforms Contentful JSON export to the target simplified format.
 * @param {Object} contentfulData - The raw JSON data exported from Contentful.
 * @returns {Object} The transformed JSON.
 */
export function transformGraphics(contentfulData) {
  const { entries, assets } = contentfulData;

  const index = buildImageIndex(assets);
 
  const graphics = entries
    .filter((entry) => entry.sys.contentType.sys.id === 'graphics')
    .map((entry) => {
      const fields = entry.fields;
      const imageId = fields.image?.['en-US']?.sys.id;
      const assetId = fields.image?.['en-US']?.sys.id;

      // Extract credits from the new structure   
      const credits = Array.isArray(fields.credits?.['en-US'])
      ? fields.credits['en-US'].map((credit) => ({
          name: credit.name,
          contribution: credit.contribution,
        }))
      : [];
      
      return {
        title: fields.title['en-US'],
        type: fields.type['en-US'],
        platform: fields.platform ? fields.platform['en-US'] : null,
        description: fields.description ? fields.description?.['en-US']?.content?.[0]?.content?.[0]?.value : '',
        nfo_text: fields.infoText ? fields.infoText?.['en-US'] : '',
        assetId: assetId ? assetId : null,
        asset: assetId ? imagePath(index, assetId, 'orig') : null,
        release_date: fields.releaseDate ? fields.releaseDate['en-US'] : null,
        card_image: imageId ? imagePath(index, imageId, 'card') : null,
        // image: imageId ? imagePath(index, imageId, 'orig') : null,
        download: imageId ? imagePath(index, imageId, 'orig') : null,
        demozoo: fields.demozooUrl ? fields.demozooUrl['en-US'] : null,
        credits: credits,
      };
    });

  return { graphics };
}

// Export for module usage
export const name = 'transformGraphics';