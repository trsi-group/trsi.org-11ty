import { describe, it, expect, vi } from 'vitest';
import { transformProductions } from '../../cms/scripts/transformProductions.js';

describe('Content Transform - Productions', () => {
  const mockContentfulData = {
    entries: [
      {
        sys: {
          id: 'prod1',
          contentType: { sys: { id: 'productions' } }
        },
        fields: {
          title: { 'en-US': 'Test Production' },
          description: { 
            'en-US': {
              content: [
                {
                  content: [
                    { value: 'A test production' }
                  ]
                }
              ]
            }
          },
          releaseDate: { 'en-US': '2024-01-01' },
          type: { 'en-US': 'Demo' },
          platform: { 'en-US': 'Amiga' },
          youTubeUrl: { 'en-US': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          pouetUrl: { 'en-US': 'https://pouet.net/prod.php?which=12345' },
          demozooUrl: { 'en-US': 'https://demozoo.org/productions/12345/' },
          csdbUrl: { 'en-US': 'https://csdb.dk/release/?id=12345' },
          downloadUrl: { 'en-US': 'https://files.scene.org/test.zip' },
          image: { 'en-US': { sys: { id: 'img1' } } },
          credits: {
            'en-US': [
              { name: 'Coder', contribution: 'Code' },
              { name: 'Artist', contribution: 'Graphics' }
            ]
          }
        },
        metadata: {
          tags: [
            { sys: { id: 'demo' } },
            { sys: { id: 'amiga' } }
          ]
        }
      },
      {
        sys: {
          id: 'other1',
          contentType: { sys: { id: 'members' } }
        },
        fields: {
          name: { 'en-US': 'Test Member' }
        }
      }
    ],
    assets: [
      {
        sys: { id: 'img1' },
        fields: {
          file: {
            'en-US': {
              fileName: 'test-image.jpg',
              url: '//images.ctfassets.net/test/test-image.jpg'
            }
          }
        }
      }
    ]
  };

  it('should transform productions data correctly', () => {
    const result = transformProductions(mockContentfulData);
    
    expect(result).toHaveProperty('productions');
    expect(result.productions).toHaveLength(1);
    
    const production = result.productions[0];
    expect(production.title).toBe('Test Production');
    expect(production.description).toBe('A test production');
    expect(production.release_date).toBe('2024-01-01');
    expect(production.type).toBe('Demo');
    expect(production.platform).toBe('Amiga');
    expect(production.youtube).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(production.pouet).toBe('https://pouet.net/prod.php?which=12345');
    expect(production.demozoo).toBe('https://demozoo.org/productions/12345/');
    expect(production.csdb).toBe('https://csdb.dk/release/?id=12345');
    expect(production.image).toBe('/img/orig/test-image.webp');
    expect(production.credits).toEqual([
      { name: 'Coder', contribution: 'Code' },
      { name: 'Artist', contribution: 'Graphics' }
    ]);
    expect(production.tags).toEqual(['demo', 'amiga']);
  });

  it('should filter only productions content type', () => {
    const result = transformProductions(mockContentfulData);
    
    // Should only return the production, not the member
    expect(result.productions).toHaveLength(1);
    expect(result.productions[0].title).toBe('Test Production');
  });

  it('should handle missing optional fields gracefully', () => {
    const minimalData = {
      entries: [
        {
          sys: {
            id: 'prod2',
            contentType: { sys: { id: 'productions' } }
          },
          fields: {
            title: { 'en-US': 'Minimal Production' },
            type: { 'en-US': 'Demo' }
          },
          metadata: { tags: [] }
        }
      ],
      assets: []
    };

    const result = transformProductions(minimalData);
    const production = result.productions[0];
    
    expect(production.title).toBe('Minimal Production');
    expect(production.description).toBe('');
    expect(production.youtube).toBe('https://www.youtube-nocookie.com/embed/error');
    expect(production.image).toBeNull();
    expect(production.credits).toEqual([]);
    expect(production.tags).toEqual([]);
  });

  it('should extract YouTube ID correctly from various URL formats', () => {
    const testCases = [
      { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
      { url: 'https://youtu.be/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
      { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', expected: 'dQw4w9WgXcQ' },
      { url: 'invalid-url', expected: 'error' }
    ];

    testCases.forEach(({ url, expected }) => {
      const data = {
        entries: [
          {
            sys: { id: 'test', contentType: { sys: { id: 'productions' } } },
            fields: { 
              title: { 'en-US': 'Test' },
              type: { 'en-US': 'Demo' },
              youTubeUrl: { 'en-US': url } 
            },
            metadata: { tags: [] }
          }
        ],
        assets: []
      };

      const result = transformProductions(data);
      expect(result.productions[0].youtube).toBe(`https://www.youtube-nocookie.com/embed/${expected}`);
    });
  });

  it('should convert image references to WebP format', () => {
    const result = transformProductions(mockContentfulData);
    const production = result.productions[0];
    
    // Original file was .jpg, should be converted to .webp
    expect(production.image).toBe('/img/orig/test-image.webp');
  });
});
