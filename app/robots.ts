import { DOMAIN_URL } from '@Constants/common';
import { uiHelper } from '@Utils/uiHelper';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  if (!uiHelper.isProduction())
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
      disallow: '/private/'
    },
    sitemap: `${DOMAIN_URL}/sitemap.xml`
  };
}
