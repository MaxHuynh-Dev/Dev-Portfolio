interface StrapiBaseResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

interface StrapiMediaFormat {
  name: string;
  hash: string;
  ext: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  path: string;
  url: string;
}

interface StrapiBaseModel {
  id: number;
  // createdAt: Date;
  // updatedAt: Date;
  // publishedAt?: Date;
}

interface StrapiMedia {
  id: number;
  alternativeText: string | null;
  caption: string | null;
  ext: '.png' | '.jpg' | '.jpeg' | '.webp';
  width: number;
  height: number;
  mime: string;
  name: string;
  previewUrl: string;
  provider: string;
  providerMetadata: null;
  formats: {
    thumbnail: StrapiMediaFormat;
    small: StrapiMediaFormat;
    medium: StrapiMediaFormat;
    large: StrapiMediaFormat;
  };
  size: number;
  url: string;
}
