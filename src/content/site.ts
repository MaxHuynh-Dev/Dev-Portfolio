/**
 * ════════════════════════════════════════════════════════════════════
 *  THE SHAPES THE SITE READS. No content, and no imports.
 *
 *  The content itself lives in Payload now — see `src/content/source.ts`,
 *  which is the only thing that talks to it and which hands back exactly
 *  the types below. That split is the point: everything downstream of the
 *  read layer (the fitting engine, the ring, the masks, the thumbnail
 *  rail) was written against these shapes and did not have to learn a
 *  second one when the source of the data changed.
 *
 *  Still plain data with no imports. `src/constants/metadata.ts` is on the
 *  server metadata path and a single import of anything browser-only here
 *  would break `next build`.
 * ════════════════════════════════════════════════════════════════════
 */

/**
 * A picture's own proportions, in intrinsic pixels.
 *
 * Recorded by Payload when the file is uploaded, which is what lets a shot
 * be laid out at its own shape before a byte of it has arrived — the
 * project page places the thumbnail rail's marker from where each shot's
 * centre falls, and a column that grew as each file landed would move
 * every one of those centres under the reader (trap 27).
 */
export interface Size {
  width: number;
  height: number;
}

export interface Profile {
  firstName: string;
  lastName: string;
  role: string;
  location: string;
  /** IANA zone — drives the live clock in the corner marks. */
  timeZone: string;
  email: string;
  availability: string;
  intro: string;
  bio: string;
}

export interface Shot {
  /**
   * A path under /media, or null.
   *
   * null is not a broken state: it renders a sized, labelled field so the
   * page's rhythm is correct before the screenshots exist. A shot row in
   * the CMS with no image attached is exactly this.
   */
  src: string | null;
  /**
   * What the shot actually shows — not "screenshot of the homepage".
   *
   * It comes off the Media document, where it is a required field, so one
   * file has exactly one description. Empty only when there is no image,
   * and in that case the field it renders is `aria-hidden` and nothing
   * reads it.
   */
  alt: string;
  /** A taller crop for the EMPTY field. A real image keeps its own shape. */
  tall?: boolean;
  /** The file's intrinsic pixels, or null when there is no file. */
  size: Size | null;
}

export interface Project {
  /** The URL segment: /work/<slug>. Lowercase, hyphens, no spaces. */
  slug: string;
  name: string;
  kind: string;
  year: string;
  /** One line. Shown under the preview in the home list. */
  summary: string;
  /** A paragraph. The first thing on the project page. */
  about: string;
  role: string[];
  stack: string[];
  /** The live site. null hides the link rather than pointing at nothing. */
  url: string | null;
  /** The home list's hover preview. null renders the placeholder field. */
  cover: string | null;
  shots: Shot[];
}

export interface MetaColumn {
  label: string;
  items: string[];
}

export interface LinkColumn {
  label: string;
  links: { label: string; href: string }[];
}

/**
 * Everything on the index that is neither a project nor the person.
 *
 * NOTE: there is no `recognition` anywhere in this file, on purpose. The
 * design this was modelled on lists Awwwards / CSSDA / FWA beside each
 * project and a "Numbers" column of em-dash placeholders here. `aboutMeta`
 * is a free list precisely so that a column is added when there is
 * something true to put in it, rather than sitting empty asking to be
 * filled.
 */
export interface SiteSettings {
  workRange: string;
  contactLinks: LinkColumn[];
}

/**
 * A photograph of the person, or nothing.
 *
 * Nothing is a correct state and not a broken one: the page renders a
 * labelled field at the same shape and its rhythm does not move. It is
 * deliberately not filled with stock — a portrait is a claim about what
 * someone looks like, which is the same rule that forbids inventing where
 * they live or who they have worked for.
 */
export interface Portrait {
  src: string;
  alt: string;
  size: Size | null;
}

/**
 * The about page.
 *
 * `body` is an ARRAY of paragraphs rather than one string, because each
 * paragraph is measured and masked line by line and `Lines` takes exactly
 * one of them. The CMS holds it as a textarea split on blank lines, which
 * keeps the editing plain and the type honest about what arrives.
 */
export interface About {
  statement: string;
  body: string[];
  portrait: Portrait | null;
  columns: MetaColumn[];
}
