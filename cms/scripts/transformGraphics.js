import { resolve } from 'path';

/**
 * Transforms Contentful JSON export to the target simplified format.
 * @param {Object} contentfulData - The raw JSON data exported from Contentful.
 * @returns {Object} The transformed JSON.
 */
export function transformGraphics(contentfulData) {
  const { entries, assets } = contentfulData;

  // Helper to find asset by ID and resolve the local path
  const findAssetPathById = (assetId) => {
    const asset = assets.find((a) => a.sys.id === assetId);
    if (asset && asset.fields.file && asset.fields.file['en-US']) {
      return asset.fields.file['en-US'].fileName.replace(/\.[^/.]+$/, ".webp");
    }
    return null;
  };
 
  const graphics = entries
    .filter((entry) => entry.sys.contentType.sys.id === 'graphics')
    .map((entry) => {
      const fields = entry.fields;
      const imageId = fields.image?.['en-US']?.sys.id;

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
        release_date: fields.releaseDate ? fields.releaseDate['en-US'] : null,
        card_image: imageId ? resolve('/img/card/', findAssetPathById(imageId)) : null,
        image: imageId ? resolve('/img/orig/', findAssetPathById(imageId)) : null,
        download: imageId ? resolve('/img/orig/', findAssetPathById(imageId)) : null,
        demozoo: fields.demozooUrl ? fields.demozooUrl['en-US'] : null,
        credits: credits,
      };
    });

  return { graphics };
}

// Export for module usage
export const name = 'transformGraphics';