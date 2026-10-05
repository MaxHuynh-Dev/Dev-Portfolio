import { APP_KEYWORDS, APP_OG_IMAGE, APP_OG_IMAGE_ALT, DOMAIN_URL } from '@Constants/common';
import type { Metadata } from 'next';
import { getFullName, getProfile } from '@/content/source';

/** The share card every page falls back to. */
const OG_IMAGE = {
  url: APP_OG_IMAGE,
  type: 'image/jpeg',
  width: 1200,
  height: 630,
  alt: APP_OG_IMAGE_ALT
};

/** Past this, Google cuts a description off mid-word in the result. */
const DESCRIPTION_MAX = 160;

/**
 * A description that fits a search result: whitespace collapsed, and cut at
 * the last word that fits rather than mid-word. The copy is the CMS's, so the
 * length is not something any one page can promise.
 */
export function clip(text: string, max = DESCRIPTION_MAX): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ')).replace(/[\s,;:.—–-]+$/, '')}…`;
}

/** The index's title, and the one a page with no title of its own takes. */
const homeTitle = (fullName: string, role: string): string => `${fullName}, ${role}`;

/**
 * The site's default metadata, built from the CMS.
 *
 * A function and not a constant, because the name, role, description and
 * contact address are content now. `app/(frontend)/layout.tsx` calls it
 * from `generateMetadata` — a root layout supports that the same way a
 * page does, and the alternative was a module-scope `await` on the server
 * metadata path, which is the one place in this app that cannot have one.
 *
 * The template puts the NAME after a page's own title — "About | Max Huynh"
 * — because the name is what anyone looking for this site types. It used to
 * be the role, so no subpage title carried the name at all. The index takes
 * the default, which says both.
 */
export async function buildDefaultMetadata(): Promise<Metadata> {
  const [profile, fullName] = await Promise.all([getProfile(), getFullName()]);
  const home = homeTitle(fullName, profile.role);

  return {
    applicationName: fullName,
    title: {
      default: home,
      template: `%s | ${fullName}`
    },
    metadataBase: new URL(DOMAIN_URL),
    description: profile.intro,
    keywords: APP_KEYWORDS,
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
      locale: 'en_US',
      url: DOMAIN_URL,
      title: home,
      description: profile.intro,
      images: [OG_IMAGE]
    },
    twitter: {
      card: 'summary_large_image',
      title: home,
      description: profile.intro,
      images: [OG_IMAGE]
    }
  };
}

type PageMeta = {
  /** The page's own title; the layout's template adds the name. Omit for the index. */
  title?: string;
  description: string;
  /** The page's path, which becomes its canonical URL and its `og:url`. */
  path: string;
  /** A share image of the page's own, used for Open Graph only. */
  image?: string | null;
};

/**
 * One page's metadata: title, description, canonical, and complete Open
 * Graph and Twitter entries.
 *
 * Complete, because Next merges metadata SHALLOWLY: a page that sets
 * `openGraph` at all replaces the layout's whole object, so a partial one
 * loses `type`, `url`, `siteName` and the image size — and a page that sets
 * none inherits the index's title and `og:url`, so every share of `/about`
 * used to read as the home page. Every page goes through here instead.
 *
 * `twitter:image` stays the site card even where `og:image` is a project's
 * cover: on X a project link shows the card (trap 6).
 */
export async function pageMetadata({
  title,
  description,
  path,
  image
}: PageMeta): Promise<Metadata> {
  const [profile, fullName] = await Promise.all([getProfile(), getFullName()]);
  const full = title === undefined ? homeTitle(fullName, profile.role) : `${title} | ${fullName}`;
  const text = clip(description);

  return {
    ...(title === undefined ? {} : { title }),
    description: text,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: fullName,
      locale: 'en_US',
      url: path,
      title: full,
      description: text,
      images: [image != null ? { url: image, alt: full } : OG_IMAGE]
    },
    twitter: {
      card: 'summary_large_image',
      title: full,
      description: text,
      images: [OG_IMAGE]
    }
  };
}
