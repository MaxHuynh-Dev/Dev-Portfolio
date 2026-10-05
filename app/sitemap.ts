import { DOMAIN_URL } from '@Constants/common';
import { IS_INDEXABLE } from '@Constants/envs';
import type { MetadataRoute } from 'next';
import { getProjects } from '@/content/source';

/**
 * Every page, and every project as its own page.
 *
 * There is no `lastModified`. It used to be `new Date()`, which stamps every
 * URL with the build time on every deploy, and a crawler that sees a date
 * change with nothing behind it learns to ignore the field for the whole
 * site. Absent is honest; a real date would need each page's `updatedAt`.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!IS_INDEXABLE) return [];
  const projects = await getProjects();
  return [
    { url: DOMAIN_URL, changeFrequency: 'yearly', priority: 1 },
    { url: `${DOMAIN_URL}/works`, changeFrequency: 'yearly', priority: 0.9 },
    { url: `${DOMAIN_URL}/about`, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${DOMAIN_URL}/experience`, changeFrequency: 'yearly', priority: 0.7 },
    ...projects.map((project) => ({
      url: `${DOMAIN_URL}/work/${project.slug}`,
      changeFrequency: 'yearly' as const,
      priority: 0.8
    }))
  ];
}
