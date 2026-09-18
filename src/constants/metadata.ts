import { APP_KEYWORDS, APP_OG_IMAGE, DOMAIN_URL } from '@Constants/common';
import type { Metadata } from 'next';
import { getFullName, getProfile } from '@/content/source';

/**
 * The site's default metadata, built from the CMS.
 *
 * A function and not a constant, because the name, role, description and
 * contact address are content now. `app/(frontend)/layout.tsx` calls it
 * from `generateMetadata` — a root layout supports that the same way a
 * page does, and the alternative was a module-scope `await` on the server
 * metadata path, which is the one place in this app that cannot have one.
 *
 * The title template is what turns a page's own title into "Name | Role",
 * which is why the index deliberately exports no metadata of its own: it
 * would apply the template to the default and read "Name | Role" where the
 * name alone belongs.
 */
export async function buildDefaultMetadata(): Promise<Metadata> {
  const [profile, fullName] = await Promise.all([getProfile(), getFullName()]);
  const titleTemplate = `%s | ${profile.role}`;

  return {
    applicationName: fullName,
    title: {
      default: fullName,
      template: titleTemplate
    },
    metadataBase: new URL(DOMAIN_URL),
    description: profile.intro,
    keywords: APP_KEYWORDS,
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: fullName
    },
    formatDetection: {
      telephone: false
    },
    openGraph: {
      type: 'website',
      siteName: fullName,
      emails: [profile.email],
      url: DOMAIN_URL,
      title: {
        default: fullName,
        template: titleTemplate
      },
      images: [
        {
          url: APP_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: fullName
        }
      ],
      description: profile.intro
    },
    twitter: {
      card: 'summary_large_image',
      title: {
        default: fullName,
        template: titleTemplate
      },
      images: [
        {
          url: APP_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: fullName
        }
      ],
      description: profile.intro
    }
  };
}
