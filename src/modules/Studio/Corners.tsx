'use client';

import { useAnchorNav } from '@Hooks/useAnchorNav';
import { useLocalClock } from '@Hooks/useLocalClock';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type React from 'react';
import { PROFILE } from '@/content/site';

const SECTIONS = [
  { label: 'work', id: 'work' },
  { label: 'about', id: 'about' },
  { label: 'contact', id: 'contact' }
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
 */
export default function Corners(): React.ReactElement {
  const time = useLocalClock(PROFILE.timeZone);
  const onNav = useAnchorNav();
  const pathname = usePathname();
  const atHome = pathname === '/';

  return (
    <>
      <div className="st-fade pointer-events-none fixed inset-x-0 top-0 z-50 bg-[linear-gradient(to_bottom,var(--paper)_0%,var(--paper)_72%,transparent_100%)] pb-[2.5rem]">
        <div className="pointer-events-auto flex items-start justify-between gap-[clamp(1rem,5vw,4rem)] px-[var(--gut)] pt-[var(--gut)]">
          <p className="st-meta">
            <Link className="text-[var(--ink)]" href="/">
              {PROFILE.firstName} {PROFILE.lastName}
            </Link>
            <br />
            {PROFILE.role.toLowerCase()}
          </p>

          <p className="st-meta text-right">
            <span suppressHydrationWarning>
              {PROFILE.location.toLowerCase()}, {time}
            </span>
            <br />
            <a className="st-link text-[var(--ink)]" href={`mailto:${PROFILE.email}`}>
              {PROFILE.email}
            </a>
          </p>
        </div>
      </div>

      <div className="st-fade pointer-events-none fixed inset-x-0 bottom-0 z-50 bg-[linear-gradient(to_top,var(--paper)_0%,var(--paper)_72%,transparent_100%)] pt-[2.5rem]">
        <div className="pointer-events-auto flex items-end justify-between gap-[clamp(1rem,5vw,4rem)] px-[var(--gut)] pb-[var(--gut)]">
          <p className="st-meta">{PROFILE.availability.toLowerCase()}</p>

          <nav aria-label="Sections">
            <ul className="st-meta flex flex-wrap justify-end gap-x-[1.1rem] gap-y-[0.2rem]">
              {SECTIONS.map((item) =>
                // These target sections of the home page. On a project page
                // those elements do not exist, so a bare "#work" would hand
                // useAnchorNav a fragment with no target and the link would
                // silently do nothing. Off the home page it has to be a
                // real navigation.
                atHome ? (
                  <li key={item.id}>
                    <a
                      className="st-link whitespace-nowrap text-[var(--ink)]"
                      href={`#${item.id}`}
                      onClick={(event) => {
                        onNav(event, `#${item.id}`);
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ) : (
                  <li key={item.id}>
                    <Link
                      className="st-link whitespace-nowrap text-[var(--ink)]"
                      href={`/#${item.id}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              )}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
