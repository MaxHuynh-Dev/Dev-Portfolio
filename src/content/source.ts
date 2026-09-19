import configPromise from '@payload-config';
import { getPayload } from 'payload';
import { cache } from 'react';
import type {
  About,
  LinkColumn,
  MetaColumn,
  Portrait,
  Profile,
  Project,
  Shot,
  SiteSettings
} from '@/content/site';
import type { Media, Project as ProjectDoc } from '@/payload/payload-types';

/**
 * ════════════════════════════════════════════════════════════════════
 *  The only thing on this site that talks to the CMS.
 *
 *  Everything above it reads `src/content/site.ts`'s shapes and knows
 *  nothing about Payload — which is what let the ring, the fitting
 *  engine, the masks and the thumbnail rail carry on unchanged when the
 *  content moved out of a file and into a database.
 *
 *  SERVER ONLY. It pulls in the Payload config, the Mongo adapter and
 *  sharp; importing it from a client component would try to send all
 *  three to the browser. The client leaves take their content as props,
 *  which is the same rule trap 5 already states for state.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * Payload's Local API, not an HTTP call.
 *
 * It runs in the same process and talks to Mongo directly, so a page being
 * statically generated does not have to wait for a server that is not
 * listening yet. `getPayload` memoises its own instance, so the connection
 * is opened once per process and not once per page.
 */
const client = async () => getPayload({ config: configPromise });

/**
 * A relationship comes back as an id when the query was shallow and as the
 * document when it was deep. Every read here asks for depth, so an id is a
 * document that could not be resolved — a file deleted out from under a
 * reference — and the right answer is the same as no image at all.
 */
const asMedia = (value: ProjectDoc['cover']): Media | null =>
  value !== null && value !== undefined && typeof value === 'object' ? value : null;

/**
 * Where the file actually is.
 *
 * The document's own `url`, and nothing derived. Uploads live on Cloudinary
 * and `disablePayloadAccessControl` makes Payload hand out the real URL
 * rather than a `/api/media/file/*` proxy, so this is a CDN address the
 * browser fetches in one hop.
 *
 * It used to build `/media/<filename>` from the filename, which was correct
 * while the files were on local disk and is exactly the kind of second guess
 * that breaks the moment storage moves — Cloudinary normalises formats, so a
 * URL reconstructed from `a.jpeg` can 404 against an object it stored as
 * `a.jpg`. The adapter records the URL it was given; this reads it back.
 */
const pathOf = (media: Media | null): string | null =>
  media === null || typeof media.url !== 'string' || media.url.length === 0 ? null : media.url;

const shotOf = (row: NonNullable<ProjectDoc['shots']>[number]): Shot => {
  const media = asMedia(row.image);
  return {
    src: pathOf(media),
    alt: media?.alt ?? '',
    tall: row.tall === true,
    // Recorded by Payload on upload. A file whose dimensions did not
    // survive is treated as having none, which falls back to the declared
    // ratio — the same thing the empty field uses.
    size:
      media !== null && typeof media.width === 'number' && typeof media.height === 'number'
        ? { width: media.width, height: media.height }
        : null
  };
};

const projectOf = (doc: ProjectDoc): Project => ({
  slug: doc.slug,
  name: doc.name,
  kind: doc.kind,
  year: doc.year,
  summary: doc.summary,
  about: doc.about,
  role: doc.role,
  stack: doc.stack,
  // Absent rather than dead: a link with nowhere to go is worse than no
  // link, and an empty string from a text field is nowhere to go.
  url: typeof doc.url === 'string' && doc.url.length > 0 ? doc.url : null,
  cover: pathOf(asMedia(doc.cover)),
  shots: (doc.shots ?? []).map(shotOf)
});

/**
 * The work, in the order the CMS holds it.
 *
 * `projects` is an orderable collection, so Payload sorts by its own
 * `_order` by default and the order is a drag in the admin rather than a
 * deploy. The index's list, the ring on /works and `generateStaticParams`
 * all iterate this one array, which is why they cannot disagree.
 *
 * `cache` is React's per-request memo: a project page asks for this in
 * `generateMetadata` and again in the page body, and this makes that one
 * query instead of two.
 */
export const getProjects = cache(async (): Promise<Project[]> => {
  const payload = await client();
  const { docs } = await payload.find({
    collection: 'projects',
    limit: 0,
    // Deep enough to resolve `cover` and each shot's `image`, and no
    // deeper — media has no relationships of its own to follow.
    depth: 1,
    overrideAccess: true
  });
  return docs.map(projectOf);
});

export const getProject = cache(async (slug: string): Promise<Project | null> => {
  const projects = await getProjects();
  return projects.find((project) => project.slug === slug) ?? null;
});

export const getProfile = cache(async (): Promise<Profile> => {
  const payload = await client();
  const doc = await payload.findGlobal({ slug: 'profile', depth: 0, overrideAccess: true });
  return {
    firstName: doc.firstName,
    lastName: doc.lastName,
    role: doc.role,
    location: doc.location,
    timeZone: doc.timeZone,
    email: doc.email,
    availability: doc.availability,
    intro: doc.intro,
    bio: doc.bio
  };
});

/** The full name, built in one place because two places have to agree. */
export const getFullName = cache(async (): Promise<string> => {
  const profile = await getProfile();
  return `${profile.firstName} ${profile.lastName}`;
});

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const payload = await client();
  const doc = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true });

  const contactLinks: LinkColumn[] = (doc.contactLinks ?? []).map((column) => ({
    label: column.label,
    links: (column.links ?? []).map((link) => ({ label: link.label, href: link.href }))
  }));

  return {
    workRange: doc.workRange,
    contactLinks,
    colophon: doc.colophon
  };
});

/**
 * The about page's own content.
 *
 * The prose arrives as one textarea and leaves as paragraphs: a blank line
 * is the separator, which is what a writer types anyway. Every run of
 * whitespace-only lines collapses to one break and empty paragraphs are
 * dropped, so a stray extra return cannot produce a mask with nothing in it.
 */
export const getAbout = cache(async (): Promise<About> => {
  const payload = await client();
  const doc = await payload.findGlobal({ slug: 'about', depth: 1, overrideAccess: true });

  const media = asMedia(doc.portrait);
  const src = pathOf(media);
  const portrait: Portrait | null =
    media === null || src === null
      ? null
      : {
          src,
          alt: media.alt,
          size:
            typeof media.width === 'number' && typeof media.height === 'number'
              ? { width: media.width, height: media.height }
              : null
        };

  const columns: MetaColumn[] = (doc.columns ?? []).map((column) => ({
    label: column.label,
    items: column.items
  }));

  return {
    statement: doc.statement,
    body: doc.body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph.length > 0),
    portrait,
    columns
  };
});
