import { resolve } from 'path';
import { buildImageIndex, imagePath } from './assetPaths.js';
import { itemSlug } from './slug.js';

/**
 * Transforms Contentful JSON export to the target simplified format.
 * @param {Object} contentfulData - The raw JSON data exported from Contentful.
 * @returns {Object} The transformed JSON.
 */
export function transformMusic(contentfulData) {
  const { entries, assets } = contentfulData;

  // Helper to find asset by ID and resolve the local path
  const findTrackAssetPathById = (assetId) => {
    const asset = assets.find((a) => a.sys.id === assetId);
    if (asset && asset.fields.file && asset.fields.file['en-US']) {
      return asset.fields.file['en-US'].fileName.replace(/ /g, '_');
    }
    return null;
  };

  const index = buildImageIndex(assets);

  /**
   * Tracks rarely carry their own artwork, so the card falls back to an image
   * of the machine they were written for. The platform field decides;
   * playerEmu only fills in when it is unset. File names are no help here:
   * UADE modules are named .sid as well and would pass for C64 tunes.
   * @param {String|null} platform - The entry's platform.
   * @param {String} playerEmu - The player backend the track needs.
   * @returns {String} The base name of the fallback image, without extension.
   */
  const platformImageName = (platform, playerEmu) => {
    if (platform) {
      if (platform.startsWith('Amiga')) return 'music-amiga';
      if (platform === 'C64') return 'music-c64';
      return 'music-player';
    }
    if (playerEmu === 'SID') return 'music-c64';
    if (playerEmu === 'MPT' || playerEmu === 'UADE') return 'music-amiga';
    return 'music-player';
  };

  const music = entries
    .filter((entry) => entry.sys.contentType.sys.id === 'music')
    .map((entry) => {
      const fields = entry.fields;
      const imageId = fields.image?.['en-US']?.sys.id;
      const assetId = fields.track?.['en-US']?.sys.id;
      const metadata = entry.metadata;
      const platform = fields.platform ? fields.platform['en-US'] : null;
      const playerEmu = fields.playerEmu ? fields.playerEmu?.['en-US'] : '';
      const fallbackImage = platformImageName(platform, playerEmu);
      
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
        slug: itemSlug(fields.title['en-US']),
        type: fields.type['en-US'],
        platform: platform,
        nfo_text: fields.infoText ? fields.infoText?.['en-US'] : '',
        assetId: assetId ? assetId : null,
        asset: assetId ? resolve('/tracks/', findTrackAssetPathById(assetId)) : null,
        playerEmu: playerEmu,
        description: fields.description ? fields.description?.['en-US']?.content?.[0]?.content?.[0]?.value : '',
        // An entry without a date must fall back to '' and never null: liquidjs's
        // `sort` compares inconsistently against null and scrambles the whole feed,
        // while '' orders before every real date and so lands last once reversed.
        release_date: fields.releaseDate ? fields.releaseDate['en-US'] : '',
        card_image: imageId ? imagePath(index, imageId, 'card') : `/img/${fallbackImage}.webp`,
        // Link previews are rendered to a fixed 1200x630 frame, fallback artwork included.
        social_image: imageId ? imagePath(index, imageId, 'social') : `/img/social/${fallbackImage}.jpg`,
        social_image_width: 1200,
        social_image_height: 630,
        download: fields.download ? fields.download['en-US'] : null,
        demozoo: fields.demozooUrl ? fields.demozooUrl['en-US'] : null,
        kestra: fields.kestraUrl ? fields.kestraUrl['en-US'] : null,
        credits: credits,
        tags: tags,
      };
    });

  return { music };
}

// Export for module usage
export const name = 'transformMusic'
