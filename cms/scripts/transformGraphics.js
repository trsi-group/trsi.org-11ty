import { buildImageIndex, imagePath, imageSize } from './assetPaths.js';
import { itemSlug } from './slug.js';

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
      const assetSize = assetId ? imageSize(index, assetId) : null;

      // Extract credits from the new structure   
      const credits = Array.isArray(fields.credits?.['en-US'])
      ? fields.credits['en-US'].map((credit) => ({
          name: credit.name,
          contribution: credit.contribution,
        }))
      : [];
      
      return {
        title: fields.title['en-US'],
        slug: itemSlug(fields.title['en-US']),
        type: fields.type['en-US'],
        platform: fields.platform ? fields.platform['en-US'] : null,
        description: fields.description ? fields.description?.['en-US']?.content?.[0]?.content?.[0]?.value : '',
        nfo_text: fields.infoText ? fields.infoText?.['en-US'] : '',
        assetId: assetId ? assetId : null,
        asset: assetId ? imagePath(index, assetId, 'orig') : null,
        // The detail page shows the full-resolution asset; its dimensions decide
        // whether the browser may smooth it when scaling up (see item-detail).
        asset_width: assetSize ? assetSize.width : null,
        asset_height: assetSize ? assetSize.height : null,
        // An entry without a date must fall back to '' and never null: liquidjs's
        // `sort` compares inconsistently against null and scrambles the whole feed,
        // while '' orders before every real date and so lands last once reversed.
        release_date: fields.releaseDate ? fields.releaseDate['en-US'] : '',
        card_image: imageId ? imagePath(index, imageId, 'card') : null,
        // image: imageId ? imagePath(index, imageId, 'orig') : null,
        download: imageId ? imagePath(index, imageId, 'orig') : null,
        // Link previews are rendered to a fixed 1200x630 frame, so the size is
        // known without measuring the source.
        social_image: assetId ? imagePath(index, assetId, 'social') : null,
        social_image_width: assetId ? 1200 : null,
        social_image_height: assetId ? 630 : null,
        demozoo: fields.demozooUrl ? fields.demozooUrl['en-US'] : null,
        credits: credits,
      };
    });

  return { graphics };
}

// Export for module usage
export const name = 'transformGraphics';