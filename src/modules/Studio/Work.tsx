'use client';

import Shot from '@Components/Shot';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { PROJECTS, WORK_RANGE } from '@/content/site';

/**
 * The work list, and the way into each project.
 *
 * One row is live at a time: the one crossing the middle of the viewport,
 * or the one under the pointer or keyboard focus. Everything else drops to
 * --ink-3 — 3.88:1 against the paper, which clears the 3:1 bar these rows
 * need as large text, and much closer to --ink than a dark-ground dim
 * would be, because dimming pulls text toward the ground and the mechanism
 * inverts with it.
 *
 * The live row's cover, summary and position sit in the right half at eye
 * level, so the list shows what a project *is* and not only what it is
 * called. Without that this band was a column of names against an empty
 * half-measure.
 */
export default function Work(): React.ReactElement {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-row]') ?? []);
    if (rows.length === 0) return;

    // Nearest row to the middle of the viewport, rather than an
    // IntersectionObserver on a one-pixel band across it. The band answers
    // only while a row is actually straddling the line, so jumping past
    // the whole list — a hash link, a restored position — left the readout
    // showing the first project with nothing on screen highlighted. This
    // always has an answer.
    let frame = 0;

    const measure = (): void => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < rows.length; index += 1) {
        const box = rows[index].getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - middle);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      }
      setActive(best);
    };

    // One measurement per frame at most, however many scroll events the
    // platform delivers. Eight rects is cheap; eight rects per event is not.
    const schedule = (): void => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Webfont swap moves every row on the page.
    void document.fonts.ready.then(schedule);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const current = PROJECTS[active];

  return (
    <section
      id="work"
      aria-labelledby="work-heading"
      className="px-[var(--gut)] pt-[clamp(6rem,18vh,12rem)] pb-[clamp(6rem,18vh,12rem)]"
    >
      <div className="flex items-baseline justify-between gap-6">
        <h2 id="work-heading" className="st-meta m-0 font-[500] text-[var(--ink)]">
          selected work
        </h2>
        <p className="st-meta tabular-nums">{WORK_RANGE}</p>
      </div>

      <div className="mt-[clamp(1.5rem,5vh,3rem)] flex flex-wrap gap-[clamp(1.5rem,5vw,4rem)]">
        <ol ref={listRef} className="m-0 min-w-0 flex-1 list-none p-0">
          {PROJECTS.map((project, index) => (
            <li key={project.slug} data-row={index}>
              <Link
                href={`/work/${project.slug}`}
                onMouseEnter={() => {
                  setActive(index);
                }}
                onFocus={() => {
                  setActive(index);
                }}
                // PageTransition reads this and writes it on the curtain, so
                // the covered moment says where you are going.
                data-transition-label={project.name}
                className="block py-[clamp(0.2rem,1vh,0.55rem)]"
              >
                <span
                  className="st-display block text-[clamp(2.1rem,7vw,5.2rem)] transition-colors duration-300"
                  style={{ color: index === active ? 'var(--ink)' : 'var(--ink-3)' }}
                >
                  {project.name}
                </span>
                {/* The aside beside this list is a visual echo and is
                    aria-hidden, so the summary and the metadata have to
                    live in the link's own accessible name or they reach
                    nobody using a screen reader. */}
                <span className="sr-only">
                  . {project.summary} {project.kind}, {project.year}
                </span>
              </Link>
            </li>
          ))}
        </ol>

        {/* The live row, shown rather than described. Deliberately not a
            live region: it mirrors content already in the list, and
            announcing it on every scroll tick would talk over the list. */}
        <aside
          aria-hidden="true"
          className="w-full shrink-0 md:sticky md:top-[24vh] md:h-fit md:w-[clamp(15rem,24vw,21rem)]"
        >
          {current !== undefined ? (
            <div key={current.slug} className="st-swap">
              <Shot
                src={current.cover}
                alt=""
                ratio="16 / 10"
                label="cover, 16:10"
                sizes="(max-width: 48rem) 100vw, 21rem"
              />
              <p className="st-display st-display-reg mt-[0.7rem] mb-0 text-[clamp(1.3rem,3vw,2rem)] tabular-nums">
                {String(active + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
              </p>
              <p className="st-meta mt-[0.2rem] mb-0">
                {current.summary}
                <br />
                {current.kind.toLowerCase()}, <span className="tabular-nums">{current.year}</span>
              </p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
