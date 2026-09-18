import type React from 'react';

import { getProfile, getProjects, getSiteSettings } from '@/content/source';

import About from './About';
import Contact from './Contact';
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
 */
export default async function Studio(): Promise<React.ReactElement> {
  const [profile, projects, settings] = await Promise.all([
    getProfile(),
    getProjects(),
    getSiteSettings()
  ]);

  return (
    <>
      <Open profile={profile} />
      <Work projects={projects} workRange={settings.workRange} />
      <About bio={profile.bio} meta={settings.aboutMeta} />
      <Contact email={profile.email} links={settings.contactLinks} colophon={settings.colophon} />
    </>
  );
}
