import type React from 'react';

import { getProfile, getSiteSettings } from '@/content/source';

import Open from './Open';

/**
 * The index.
 *
 * **One band, and it is the opening.** The page has been reduced to the
 * name, what the work is, and where to reach him — held to a single screen
 * that does not scroll (trap 41). The work list that used to sit under it
 * is gone; `/works` is where the projects live now, and the corner mark
 * says so.
 *
 * A server component, with no client boundary around it and no scroll
 * machinery: everything on this page arrives on `load`. The one client leaf
 * is the opening itself, which owns the fitting engine.
 *
 * It is also where this page's content is read — one read, here, handed
 * down, rather than a leaf reaching into the CMS (it could not: it is a
 * client component, and the read layer pulls in Payload, Mongo and sharp).
 * The reads are memoised per request, so the corner marks asking for the
 * profile in the layout and this asking for it again is one query.
 */
export default async function Studio(): Promise<React.ReactElement> {
  const [profile, settings] = await Promise.all([getProfile(), getSiteSettings()]);

  return <Open profile={profile} links={settings.contactLinks} />;
}
