import { resolve } from 'path';
import { buildImageIndex, imagePath } from './assetPaths.js';

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
   * @returns {String} The site-absolute path of the fallback image.
   */
  const platformImage = (platform, playerEmu) => {
    if (platform) {
      if (platform.startsWith('Amiga')) return '/img/music-amiga.webp';
      if (platform === 'C64') return '/img/music-c64.webp';
      return '/img/music-player.webp';
    }
    if (playerEmu === 'SID') return '/img/music-c64.webp';
    if (playerEmu === 'MPT' || playerEmu === 'UADE') return '/img/music-amiga.webp';
    return '/img/music-player.webp';
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
        platform: platform,
        nfo_text: fields.infoText ? fields.infoText?.['en-US'] : '',
        assetId: assetId ? assetId : null,
        asset: assetId ? resolve('/tracks/', findTrackAssetPathById(assetId)) : null,
        playerEmu: playerEmu,
        description: fields.description ? fields.description?.['en-US']?.content?.[0]?.content?.[0]?.value : '',
        release_date: fields.releaseDate ? fields.releaseDate['en-US'] : null,
        card_image: imageId ? imagePath(index, imageId, 'card') : platformImage(platform, playerEmu),
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
