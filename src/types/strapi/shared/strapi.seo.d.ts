interface StrapiSocialSeo {
  social: 'Facebook' | 'Twitter';
  title: string;
  description: string;
  thumbnail: StrapiMedia;
}

interface StrapiSeo {
  metaTitle: string;
  metaDescription: string;
  metaImage: StrapiMedia;
  keywords: string;

  metaRobots: string;
  structuredData: string;
  metaViewport: string;
  openGraph: StrapiOpenGraph;
  socials: StrapiSocialSeo[];
}

interface StrapiOpenGraph {
  ogTitle: string;
  ogDescription: string;
  ogImage: StrapiMedia;
  ogUrl: string;
  ogType: string;
}
