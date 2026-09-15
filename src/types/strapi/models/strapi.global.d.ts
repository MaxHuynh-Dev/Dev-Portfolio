type StrapiGlobal = StrapiBaseModel & {
  email: string;
  copyright: string;
  describe: string;
  profession_specialization: string;
  location: string;
  seo: StrapiSeo;
  socials: StrapiAnchor[];
};
