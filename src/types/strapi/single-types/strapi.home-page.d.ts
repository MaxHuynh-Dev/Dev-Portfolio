type StrapiHomePage = StrapiBaseModel & {
  hero: StrapiHeroWithVimeoSection;

  labelStorySection: string;
  stories: StrapiStory[];
  labelGallerySection: string;
  galleries: StrapiGallery[];
  labelServiceSection: string;
  services: StrapiService[];
  seo: StrapiSeo;
};
