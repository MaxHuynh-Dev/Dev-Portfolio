import { DOMAIN_URL } from '@Constants/common';
import { uiHelper } from '@Utils/uiHelper';
import type { MetadataRoute } from 'next';
import { getProjects } from '@/content/source';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!uiHelper.isProduction()) return [];
  const projects = await getProjects();
  return [
    {
      url: DOMAIN_URL,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1
    },
    {
      url: `${DOMAIN_URL}/works`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.9
    },
    // Every project is its own page now. Leaving them out of the sitemap
    // would mean the only indexable thing on the site is the index.
    ...projects.map((project) => ({
      url: `${DOMAIN_URL}/work/${project.slug}`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.8
    }))
  ];
}
