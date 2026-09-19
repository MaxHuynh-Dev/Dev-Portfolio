import type React from 'react';

import { getProfile, getProjects, getSiteSettings } from '@/content/source';

import Open from './Open';
import Work from './Work';

/**
 * The page.
 *
 * A server component composing four bands. There is no client boundary
 * wrapping the whole page and no scroll-reveal machinery: content arrives
 * already placed. The only client leaves are the ones that genuinely own
 * state — the opening's fitting engine, the work list's focus tracking,
 * and the corner marks' clock.
 *
 * It is also where the page's content is read. One read, here, handed down
 * — rather than four leaves each reaching into the CMS, two of which are
 * client components and could not anyway. The reads are memoised per
 * request, so the corner marks asking for the profile in the layout and
 * this asking for it again is one query.
 *
 * **Two bands, and both of them are the work.** Contact moved into the
 * opening (trap 38), About became a page (trap 39), and the colophon went
 * with it — an account of how the site was built belongs beside the account
 * of who built it, not under the list of projects. What is left is the name
 * and the work, which is what an index is for.
 */
export default async function Studio(): Promise<React.ReactElement> {
  const [profile, projects, settings] = await Promise.all([
    getProfile(),
    getProjects(),
    getSiteSettings()
  ]);

  return (
    <>
      <Open profile={profile} links={settings.contactLinks} />
      <Work projects={projects} workRange={settings.workRange} />
    </>
  );
}
