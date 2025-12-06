import fs from 'fs';
import path from 'path';

/**
 * Copies track assets from the Contentful export to the local track directory.
 * @param {Object} contentfulData - The raw JSON data exported from Contentful.
 */
export function copyTrackAssets(contentfulData, exportDir, assetDir) {
  const { entries, assets } = contentfulData;

  // Ensure the target directory exists
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  /**
   * Recursively searches for a file in a directory and its subdirectories.
   * @param {String} dir - The directory to search.
   * @param {String} fileName - The name of the file to find.
   * @returns {String|null} - The full path to the file if found, otherwise null.
   */
  function findFileRecursively(dir, fileName) {
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dir, file.name);
      if (file.isDirectory()) {
        const result = findFileRecursively(fullPath, fileName);
        if (result) return result;
      } else if (file.isFile() && file.name === fileName) {
        return fullPath;
      }
    }

    return null;
  }

  // Process music entries and copy their track assets
  entries
    .filter((entry) => entry.sys.contentType.sys.id === 'music')
    .forEach((entry) => {
      const { fields } = entry;
      const trackAssetId = fields.track?.['en-US']?.sys.id;
      
      if (trackAssetId) {
        // Find the corresponding asset
        const trackAsset = assets.find((asset) => asset.sys.id === trackAssetId);
        
        if (trackAsset && trackAsset.fields.file?.['en-US']) {
          const fileName = trackAsset.fields.file['en-US'].fileName.replace(/ /g, '_');
          
          // Search for the file in the asset directory
          const sourceFilePath = findFileRecursively(assetDir, fileName);
          
          if (sourceFilePath) {
            const targetFilePath = path.join(exportDir, fileName);
            
            try {
              fs.copyFileSync(sourceFilePath, targetFilePath);
            } catch (error) {
              console.error(`Failed to copy ${fileName}:`, error.message);
            }
          } else {
            console.warn(`Track file not found: ${fileName}`);
          }
        }
      }
    });
}

// Export for module usage
export const name = 'copyTrackAssets';