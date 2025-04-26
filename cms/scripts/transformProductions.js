import { resolve } from 'path';

/**
 * Transforms Contentful JSON export to the target simplified format.
 * @param {Object} contentfulData - The raw JSON data exported from Contentful.
 * @returns {Object} The transformed JSON.
 */
export function transformProductions(contentfulData) {
  const { entries, assets } = contentfulData;

  // Helper to find asset by ID and resolve the local path
  const findAssetPathById = (assetId) => {
    const asset = assets.find((a) => a.sys.id === assetId);
    if (asset && asset.fields.file && asset.fields.file['en-US']) {
      return asset.fields.file['en-US'].fileName.replace(/\.[^/.]+$/, ".webp");
    }
    return null;
  };

  // credits: https://stackoverflow.com/a/8260383
  const getYtId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length == 11) {
      return match[2];
    } else {
      return "error";
    }
  }

  const productions = entries
    .filter((entry) => entry.sys.contentType.sys.id === 'productions')
    .map((entry) => {
      const fields = entry.fields;
      const metadata = entry.metadata;
      const imageId = fields.image?.['en-US']?.sys.id;
      
      // filter youtube video ID to be used with nocookie URL
      const ytUrl = fields.youTubeUrl ? fields.youTubeUrl['en-US'] : null;
      const ytId = getYtId(ytUrl);

      // Extract credits from the new structure
      const credits = fields.credits?.['en-US']?.map((credit) => ({
        name: credit.name,
        contribution: credit.contribution,
      })) || [];

      const tags = metadata.tags.map(tag => tag.sys.id);

      return {
        title: fields.title['en-US'],
        type: fields.type['en-US'],
        release_date: fields.releaseDate ? fields.releaseDate['en-US'] : '',
        description: fields.description ? fields.description?.['en-US']?.content?.[0]?.content?.[0]?.value : '',
        nfo_text: fields.infoText ? fields.infoText?.['en-US'] : '',
        card_image: imageId ? resolve('/img/card/', findAssetPathById(imageId)) : null,
        image: imageId ? resolve('/img/orig/', findAssetPathById(imageId)) : null,
        platform: fields.platform ? fields.platform['en-US'] : '',
        youtube: "https://www.youtube-nocookie.com/embed/" + ytId,
        pouet: fields.pouetUrl ? fields.pouetUrl['en-US'] : null,
        demozoo: fields.demozooUrl ? fields.demozooUrl['en-US'] : null,
        credits: credits,
        tags: tags,
      };
    });
  // console.log("productions: " + JSON.stringify(productions, null, 2));

  return { productions };
}

// Export for module usage
export const name = 'transformProductions';
