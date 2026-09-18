'use client';

import Link from 'next/link';
import type React from 'react';
import { PROJECTS } from '@/content/site';

/**
 * The same projects, as a plain list.
 *
 * The ring is a good way to look at covers and a poor way to read eight
 * names at once, so it is not the only way in. This is also the view that
 * answers the ring's one real cost: it takes the wheel away from the reader
 * for as long as they are on it. Here the page scrolls the way every other
 * page does.
 *
 * Only the name dims. The number and the metadata beside it stay at full
 * --ink-2, because dimming a whole row takes the readout down with the
 * title it is meant to be explaining.
 *
 * --ink-2 and not --ink-3: these rows are not display-sized. At 320 the
 * name computes to about 17px, under the 18.66px where bold type counts as
 * large, so the bar is 4.5:1 — which --ink-3 (3.88:1) fails and --ink-2
 * (5.05:1) clears.
 */
export default function Roll({
  active,
  onActive
}: {
  active: number;
  onActive: (index: number) => void;
}): React.ReactElement {
  // Capped, unlike the readout above it. Left to the full width of a 1440
  // screen the year ends up a thousand pixels from the name it belongs to,
  // and the row stops reading as one thing.
  return (
    <ol className="m-0 max-w-[56rem] list-none p-0">
      {PROJECTS.map((project, index) => (
        <li key={project.slug}>
          <Link
            href={`/work/${project.slug}`}
            data-transition-label={project.name}
            onMouseEnter={() => {
              onActive(index);
            }}
            onFocus={() => {
              onActive(index);
            }}
            className="grid grid-cols-[2.2rem_1fr_auto] items-baseline gap-x-[0.75rem] py-[clamp(0.3rem,1.1vh,0.6rem)]"
          >
            <span className="st-meta tabular-nums">{String(index + 1).padStart(2, '0')}</span>
            <span
              className="st-display min-w-0 text-[clamp(1.1rem,2.8vw,1.75rem)] leading-[1.15] transition-colors duration-300"
              style={{ color: index === active ? 'var(--ink)' : 'var(--ink-2)' }}
            >
              {project.name}
            </span>
            <span className="st-meta whitespace-nowrap">
              {project.kind.toLowerCase()}, <span className="tabular-nums">{project.year}</span>
            </span>
            {/* The readout above this list is a visual echo and is hidden,
                so the one line describing the project has to live in the
                link's own accessible name or it reaches nobody. */}
            <span className="sr-only">. {project.summary}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
