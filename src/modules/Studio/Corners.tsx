'use client';

import { useLocalClock } from '@Hooks/useLocalClock';
import Link from 'next/link';
import type React from 'react';
import type { Profile } from '@/content/site';

/**
 * Two marks, and both of them are real pages.
 *
 * There were four. `contact` went when contact moved up into the opening
 * and the address left it for the corner above — a mark that says one word
 * and arrives somewhere named another is worse than no mark. `work` went
 * with the index's work list (trap 41): it pointed at `/#work`, and the
 * fragment it named no longer exists.
 *
 * What was `all work` is simply `work` now, for the same vocabulary reason
 * the `contact` mark was dropped for. `all` was a comparison with the
 * subset on the index, and there is no subset any more — a mark that calls
 * itself `all work` beside nothing else would be answering a question
 * nobody can ask.
 *
 * **Both marks are routes, so nothing here navigates by fragment.** That is
 * why there is no `useAnchorNav` in this file any more, and why the hook
 * itself is gone: it existed to put back the hash update and the focus move
 * that `preventDefault()` cancels, and the index was its only caller. The
 * `#contact` id stays on the opening's contact block — nothing points at it
 * now, but it is a stable anchor for a link written somewhere else, and an
 * id costs nothing.
 */
const SECTIONS: { label: string; route: string }[] = [
  { label: 'work', route: '/works' },
  { label: 'about', route: '/about' }
];

/**
 * The four corner marks.
 *
 * Every piece of metadata on the page lives here, at the edges, in
 * lowercase — which is the whole point. The version this replaced set the
 * same information as tracked-out all-caps eyebrows in the flow of the
 * page, above each section. That treatment is a reliable tell and it also
 * pushed the actual content down the screen.
 *
 * Fixed, so they hold the frame while the page scrolls. The paper gradient
 * behind each row is what stops body copy sliding underneath and colliding;
 * it is invisible against a flat ground until something passes under it.
 * `pointer-events` is off on the gradient and back on for the text, or the
 * bands would swallow clicks across the full width of the page.
 *
 * On the index nothing passes under them at all now — that page is one
 * screen and does not scroll — but the gradient stays, because these are
 * the same marks on `/works`, `/about` and every project page, where things
 * very much do.
 */
export default function Corners({ profile }: { profile: Profile }): React.ReactElement {
  const time = useLocalClock(profile.timeZone);

  return (
    <>
      <div className="st-fade pointer-events-none fixed inset-x-0 top-0 z-50 bg-[linear-gradient(to_bottom,var(--paper)_0%,var(--paper)_72%,transparent_100%)] pb-[2.5rem]">
        <div className="pointer-events-auto flex items-start justify-between gap-[clamp(1rem,5vw,4rem)] px-[var(--gut)] pt-[var(--gut)]">
          <p className="st-meta">
            <Link className="text-[var(--ink)]" href="/">
              {profile.firstName} {profile.lastName}
            </Link>
            <br />
            {profile.role.toLowerCase()}
          </p>

          <p className="st-meta text-right">
            <span suppressHydrationWarning>
              {profile.location.toLowerCase()}, {time}
            </span>
            <br />
            <a className="st-link text-[var(--ink)]" href={`mailto:${profile.email}`}>
              {profile.email}
            </a>
          </p>
        </div>
      </div>

      <div className="st-fade pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-[linear-gradient(to_top,var(--paper)_0%,var(--paper)_72%,transparent_100%)] pt-[2.5rem]">
        <div className="pointer-events-auto flex items-end justify-between gap-[clamp(1rem,5vw,4rem)] px-[var(--gut)] pb-[var(--gut)]">
          <p className="st-meta">{profile.availability.toLowerCase()}</p>

          <nav aria-label="Sections">
            <ul className="st-meta flex flex-wrap justify-end gap-x-[1.1rem] gap-y-[0.2rem]">
              {SECTIONS.map((item) => (
                // PageTransition reads the label off the dataset and writes
                // it on the curtain, so the covered moment says where you
                // are going.
                <li key={item.label}>
                  <Link
                    className="st-link whitespace-nowrap text-[var(--ink)]"
                    href={item.route}
                    data-transition-label={item.label}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
