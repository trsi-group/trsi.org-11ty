import { resolve } from 'path';

/**
 * Transforms Contentful JSON export to the target simplified format.
 * @param {Object} contentfulData - The raw JSON data exported from Contentful.
 * @returns {Object} The transformed JSON.
 */
export function transformMusic(contentfulData) {
  const { entries, assets } = contentfulData;

  // Helper to find asset by ID and resolve the local path
  const findAssetPathById = (assetId) => {
    const asset = assets.find((a) => a.sys.id === assetId);
    if (asset && asset.fields.file && asset.fields.file['en-US']) {
      return asset.fields.file['en-US'].fileName.replace(/\.[^/.]+$/, ".webp");
    }
    return null;
  };

  const music = entries
    .filter((entry) => entry.sys.contentType.sys.id === 'music')
    .map((entry) => {
      const fields = entry.fields;
      const imageId = fields.image?.['en-US']?.sys.id;
      const metadata = entry.metadata;
      
      // Extract credits from the new structure   
      const credits = Array.isArray(fields.credits?.['en-US'])
      ? fields.credits['en-US'].map((credit) => ({
          name: credit.name,
          contribution: credit.contribution,
        }))
      : [];
      
      const tags = metadata.tags.map(tag => tag.sys.id);
      return {
        title: fields.title['en-US'],
        type: fields.type['en-US'],
        type: fields.type['en-US'],
        platform: fields.platform ? fields.platform['en-US'] : null,
        nfo_text: fields.infoText ? fields.infoText?.['en-US'] : '',
        description: fields.description ? fields.description?.['en-US']?.content?.[0]?.content?.[0]?.value : '',
        release_date: fields.releaseDate ? fields.releaseDate['en-US'] : null,
        card_image: imageId ? resolve('/img/card/', findAssetPathById(imageId)) : resolve('/img/music-player.webp'),
        image: imageId ? resolve('/img/orig/', findAssetPathById(imageId)) : resolve('/img/music-player.webp'),
        download: fields.download ? fields.download['en-US'] : null,
        demozoo: fields.demozooUrl ? fields.demozooUrl['en-US'] : null,
        credits: credits,
        tags: tags,
      };
    });

  return { music };
}

// Export for module usage
export const name = 'transformMembers'
