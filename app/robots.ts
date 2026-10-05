import { DOMAIN_URL } from '@Constants/common';
import { IS_INDEXABLE } from '@Constants/envs';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  if (!IS_INDEXABLE)
    return {
      rules: {
        userAgent: '*',
        disallow: '/'
      },
      sitemap: `${DOMAIN_URL}/sitemap.xml`
    };
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Payload's admin and its REST + GraphQL routes. The admin already
      // sends its own noindex; this keeps crawlers from spending the visit.
      disallow: ['/admin', '/api']
    },
    sitemap: `${DOMAIN_URL}/sitemap.xml`
  };
}
