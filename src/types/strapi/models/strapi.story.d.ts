type StrapiStoryBaseModel = StrapiBaseModel & StrapiStory;

interface StrapiStory {
  documentId: string;
  title: string;
  description: string;
  thumbnail: StrapiMedia;
}
