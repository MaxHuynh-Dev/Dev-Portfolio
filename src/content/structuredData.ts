import { DOMAIN_URL } from '@Constants/common';
import type { Project } from './site';
import { getAbout, getExperience, getFullName, getProfile, getSiteSettings } from './source';

/**
 * Schema.org descriptions of the site, for search engines. SERVER ONLY — it
 * reads the CMS through `source.ts`.
 *
 * Every fact here is one the site already publishes: the name, role, place
 * and address from the profile, the social links from site settings, the
 * current employer from the experience collection, the skills from the about
 * page's columns. Nothing is written for search engines that a reader cannot
 * see on a page — the same rule as the CMS's (never invent biography).
 *
 * The person and the site carry an `@id` so each page can point at them
 * rather than describe them again; every page that mentions the person still
 * includes the full node, because a crawler reads one page at a time.
 */

export type Node = Record<string, unknown>;

const PERSON_ID = `${DOMAIN_URL}/#person`;
const WEBSITE_ID = `${DOMAIN_URL}/#website`;
const isWebUrl = (href: string): boolean => /^https?:\/\//.test(href);
const pageUrl = (path: string): string => (path === '/' ? DOMAIN_URL : `${DOMAIN_URL}${path}`);

export async function personNode(): Promise<Node> {
  const [profile, fullName, settings, about, positions] = await Promise.all([
    getProfile(),
    getFullName(),
    getSiteSettings(),
    getAbout(),
    getExperience()
  ]);
  const current = positions.find((position) => position.end === null);
  const sameAs = settings.contactLinks
    .flatMap((column) => column.links.map((link) => link.href))
    .filter(isWebUrl);
  const knowsAbout = [...new Set(about.columns.flatMap((column) => column.items))];

  return {
    '@type': 'Person',
    '@id': PERSON_ID,
    name: fullName,
    givenName: profile.firstName,
    familyName: profile.lastName,
    jobTitle: profile.role,
    url: DOMAIN_URL,
    email: `mailto:${profile.email}`,
    address: { '@type': 'PostalAddress', addressLocality: profile.location },
    ...(current === undefined
      ? {}
      : {
          worksFor: {
            '@type': 'Organization',
            name: current.company,
            ...(current.url !== null && isWebUrl(current.url) ? { url: current.url } : {})
          }
        }),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(knowsAbout.length > 0 ? { knowsAbout } : {})
  };
}

export async function websiteNode(): Promise<Node> {
  const [profile, fullName] = await Promise.all([getProfile(), getFullName()]);
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: DOMAIN_URL,
    name: fullName,
    description: profile.intro,
    inLanguage: 'en',
    publisher: { '@id': PERSON_ID }
  };
}

/** A page that is about the person: `/about` as a profile, `/experience` as a page about them. */
export function profilePageNode(path: string, name: string, type = 'ProfilePage'): Node {
  return {
    '@type': type,
    '@id': pageUrl(path),
    url: pageUrl(path),
    name,
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    [type === 'ProfilePage' ? 'mainEntity' : 'about']: { '@id': PERSON_ID }
  };
}

/** `/works`: the list of projects, in the CMS's own order. */
export function workListNode(name: string, projects: Project[]): Node {
  return {
    '@type': 'CollectionPage',
    '@id': pageUrl('/works'),
    url: pageUrl('/works'),
    name,
    inLanguage: 'en',
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: projects.map((project, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: pageUrl(`/work/${project.slug}`),
        name: project.name
      }))
    }
  };
}

/** One project: the work itself, and where it sits in the site. */
export function projectNodes(project: Project): Node[] {
  const url = pageUrl(`/work/${project.slug}`);
  return [
    {
      '@type': 'CreativeWork',
      '@id': `${url}#work`,
      url,
      name: project.name,
      description: project.summary,
      genre: project.kind,
      inLanguage: 'en',
      creator: { '@id': PERSON_ID },
      ...(/^\d{4}$/.test(project.year) ? { dateCreated: project.year } : {}),
      ...(project.cover !== null ? { image: project.cover } : {}),
      ...(project.stack.length > 0 ? { keywords: project.stack.join(', ') } : {}),
      ...(project.url !== null && isWebUrl(project.url) ? { sameAs: project.url } : {})
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Work', item: pageUrl('/works') },
        { '@type': 'ListItem', position: 2, name: project.name, item: url }
      ]
    }
  ];
}
