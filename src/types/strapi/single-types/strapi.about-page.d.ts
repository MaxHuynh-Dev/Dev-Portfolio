interface StrapiAboutPage {
  heroSection: StrapiHeroWithImageSection;

  ourTeamTitle: string;
  ourTeamDescription: string;
  ourTeamImage: StrapiMedia;

  ourStoryTitle: string;
  ourStoryDescription: string;
  ourStoryImage: StrapiMedia;

  parallaxImage: StrapiMedia;

  teamSectionTitle: string;
  teamMembers: {
    data: StrapiMember[];
  };

  seo: StrapiSeo;
}
