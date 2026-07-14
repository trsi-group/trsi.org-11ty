/**
 * Hero slides.
 *
 * PLACEHOLDER (decision D1 in plans/2026-redesign.md): no image in Contentful is
 * wide enough for the hero — four of six post images are square and the smallest
 * is 391px. Until a wide image source exists in the CMS, this returns one fixed
 * slide. The slider itself already handles any number of slides.
 *
 * To switch to a CMS source, return an array of the same shape from cms data:
 *   { image, image_sm, title, link }
 *
 * @typedef {{ image: string, image_sm: string, title: string, link: string | null }} HeroSlide
 * @returns {HeroSlide[]}
 */
export default function () {
  return [
    {
      image: '/img/hero-placeholder.webp',
      image_sm: '/img/hero-placeholder.webp',
      title: 'TRSI at the demoparty',
      link: null,
    },
  ];
}
