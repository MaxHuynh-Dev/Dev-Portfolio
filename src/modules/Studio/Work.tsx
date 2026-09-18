'use client';

import Reveal from '@Components/Reveal';
import Shot from '@Components/Shot';
import Link from 'next/link';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Project } from '@/content/site';

/**
 * How much of the gap to a POINTED-AT row is closed per frame.
 *
 * Only the pointer and the keyboard need this. Scrolling does not: the
 * scroll already is the position, and easing toward it would be a second
 * opinion about where the edge belongs, always a few frames behind the
 * first — the mistake the ring's readout and the thumbnail rail both had
 * to have taken out of them.
 *
 * Expressed per 60Hz frame and corrected by the real delta below, so a
 * 120Hz screen does not close twice as fast.
 */
const CLOSE_PER_FRAME = 0.26;

/** Near enough to a pointed-at row to stop easing and hand back to scroll. */
const EPSILON = 0.0015;

/**
 * The names' arrival, when the list is first reached.
 *
 * Small enough that a row reached on its own does not feel held back, and
 * enough to read as a wave when the whole list arrives at once — which is
 * what happens coming from `/#work`, the link the corner marks actually
 * point at off the index.
 */
const ROW_STAGGER_MS = 38;
const ROW_RISE_MS = 620;

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
export default function Work({
  projects,
  workRange
}: {
  projects: Project[];
  workRange: string;
}): React.ReactElement {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  /** The row the pointer or the keyboard is on, or null for "follow scroll". */
  const pinned = useRef<number | null>(null);
  /** Where the preview is, in row units, as a float. Never state. */
  const at = useRef(0);
  /** True only while closing a gap the pointer opened. */
  const easing = useRef(false);
  /** Bumped to wake the frame loop from a React event handler. */
  const wake = useRef<() => void>(() => undefined);

  useEffect(() => {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-row]') ?? []);
    const layers = Array.from(
      frameRef.current?.querySelectorAll<HTMLElement>('[data-cover]') ?? []
    );
    if (rows.length === 0 || layers.length === 0) return;
    const inners = layers.map((layer) => layer.querySelector<HTMLElement>('[data-cover-inner]'));

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduce = motion.matches;
    const onQuery = (): void => {
      reduce = motion.matches;
      wake.current();
    };
    motion.addEventListener('change', onQuery);

    /**
     * Where the reader is, in row units, as a float.
     *
     * The same shape as the thumbnail rail's reading on a project page:
     * the middle of the screen falls between two row centres, and how far
     * between them is the fraction. Outside the first and the last it
     * clamps, so the preview parks on an end rather than running off.
     *
     * A whole number is what the list's colour wants and a float is what
     * the wipe wants, and taking them from the same reading is what stops
     * the live name and the live picture ever disagreeing.
     */
    const scrollAt = (): number => {
      const middle = window.innerHeight / 2;
      const centres = rows.map((row) => {
        const box = row.getBoundingClientRect();
        return box.top + box.height / 2;
      });
      if (middle <= centres[0]) return 0;
      const last = centres.length - 1;
      if (middle >= centres[last]) return last;
      for (let index = 0; index < last; index += 1) {
        if (middle >= centres[index] && middle <= centres[index + 1]) {
          const span = centres[index + 1] - centres[index];
          return span === 0 ? index : index + (middle - centres[index]) / span;
        }
      }
      return last;
    };

    /**
     * Place every layer from one number.
     *
     * Two layers are ever in play: the one the position has passed, sitting
     * at rest underneath, and the one it is heading for, riding on top with
     * as much of itself in frame as the fraction says. Everything else is
     * parked a whole frame below, out of the clip.
     *
     * Scrolling DOWN raises the next project into the frame; scrolling back
     * UP lowers it out again, because the fraction simply runs backwards.
     * There is no direction to detect and no reverse case to write — one
     * expression covers both, which is also why it cannot get stuck part
     * way when the reader changes their mind mid-wipe.
     *
     * The inner counter-move is what makes it a mask and not a slide: the
     * layer travels up by exactly what its contents travel down, so the
     * picture never moves at all and only the edge does.
     */
    const draw = (position: number): void => {
      const last = layers.length - 1;
      const first = Math.min(last, Math.max(0, Math.floor(position)));
      const next = Math.min(last, first + 1);
      const part = Math.min(1, Math.max(0, position - first));

      for (let index = 0; index <= last; index += 1) {
        // Parked below the frame unless this layer is one of the two.
        let y = 100;
        let depth = 0;
        if (index === first) {
          y = 0;
          depth = 1;
        }
        // Skipped when the position has clamped to an end, where `next` and
        // `first` are the same layer and the rest pose is the right one.
        if (index === next && next !== first) {
          y = (1 - part) * 100;
          depth = 2;
        }
        const layer = layers[index];
        layer.style.transform = `translateY(${y.toFixed(3)}%)`;
        layer.style.zIndex = String(depth);
        const inner = inners[index];
        if (inner !== null) inner.style.transform = `translateY(${(-y).toFixed(3)}%)`;
      }
    };

    let frame = 0;
    let lastTime = 0;

    const tick = (now: number): void => {
      frame = 0;
      const delta = lastTime === 0 ? 16.667 : Math.min(64, now - lastTime);
      lastTime = now;

      const target = pinned.current ?? scrollAt();

      if (easing.current) {
        const gap = target - at.current;
        if (Math.abs(gap) < EPSILON) {
          at.current = target;
          easing.current = false;
        } else {
          // Frame-rate independent: the same share of the gap per unit of
          // TIME rather than per frame, so 120Hz is not twice as fast.
          at.current += gap * (1 - (1 - CLOSE_PER_FRAME) ** (delta / 16.667));
        }
      } else {
        // Assigned, not eased. The scroll IS the position.
        at.current = target;
      }

      // Under `reduce` the preview stands on whole projects. It answers the
      // reader's own scrolling, so it is allowed to change at all — but an
      // edge sliding continuously under the pointer is the query's own
      // case, and the discrete version says exactly as much. Same rule the
      // thumbnail rail follows.
      draw(reduce ? Math.round(at.current) : at.current);
      setActive(Math.round(at.current));

      if (easing.current) schedule();
    };

    const schedule = (): void => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(tick);
    };

    wake.current = schedule;

    at.current = scrollAt();
    draw(reduce ? Math.round(at.current) : at.current);
    setActive(Math.round(at.current));

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Webfont swap moves every row on the page.
    void document.fonts.ready.then(schedule);

    return () => {
      motion.removeEventListener('change', onQuery);
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      wake.current = () => undefined;
    };
  }, []);

  /** Pointing at a row or tabbing to it takes the preview off the scroll. */
  const pin = (index: number | null): void => {
    pinned.current = index;
    easing.current = true;
    wake.current();
  };

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
        <p className="st-meta tabular-nums">{workRange}</p>
      </div>

      <div className="mt-[clamp(1.5rem,5vh,3rem)] flex flex-wrap gap-[clamp(1.5rem,5vw,4rem)]">
        {/* Leaving the list hands the preview back to the scroll, rather
            than abandoning it wherever the pointer happened to stop. */}
        <ol
          ref={listRef}
          onMouseLeave={() => {
            pin(null);
          }}
          className="m-0 min-w-0 flex-1 list-none p-0"
        >
          {projects.map((project, index) => (
            <li key={project.slug} data-row={index}>
              <Link
                href={`/work/${project.slug}`}
                onMouseEnter={() => {
                  pin(index);
                }}
                onFocus={() => {
                  pin(index);
                }}
                onBlur={() => {
                  pin(null);
                }}
                // PageTransition reads this and writes it on the curtain, so
                // the covered moment says where you are going.
                data-transition-label={project.name}
                className="block py-[clamp(0.2rem,1vh,0.55rem)]"
              >
                {/* The colour sits OUTSIDE the mask and is inherited in.
                    Putting `transition-colors` on the line itself would set
                    `transition-property` and take the transform transition
                    with it — the same trap the list on /works had to have
                    taken out of it.

                    `.st-mast` and not `.st-line`, because this is display
                    type: `.st-display` sets line-height 0.9, tighter than
                    the face's own box, so a mask cut to the box shaves the
                    descenders off `Hylix` and `Project`. That pair pushes
                    the clip out with padding and takes the space back with
                    a negative margin, so the row's rhythm does not move. */}
                {/* The SIZE has to sit at or above the mask, not on the
                    line inside it. `.st-mast` pushes its clip out by 0.2em
                    to clear the glyphs, and an em resolves against the
                    element's own font-size — put the display size on the
                    line and the mask is still at body size, so it reserves
                    3px where the descender needs 17 and shaves the `y` of
                    `Hylix` and the `j` of `Project`. Measured at -6.5px of
                    headroom before this moved up a level. The masthead only
                    ever worked because `.st-fit` sizes the <h1> the mask
                    lives inside. */}
                <span
                  className="block text-[clamp(2.1rem,7vw,5.2rem)] transition-colors duration-300"
                  style={{ color: index === active ? 'var(--ink)' : 'var(--ink-3)' }}
                >
                  <Reveal
                    on="scroll"
                    className="st-mast"
                    delay={index * ROW_STAGGER_MS}
                    rise={ROW_RISE_MS}
                  >
                    <span className="st-mast-line st-display block">{project.name}</span>
                  </Reveal>
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
            announcing it on every scroll tick would talk over the list.

            Every project is here, not just the live one — see the wipe
            above. They cost nothing in the accessibility tree, because the
            whole aside is hidden from it and each row's link already
            carries its own summary, category and year. */}
        <aside
          aria-hidden="true"
          className="w-full shrink-0 md:sticky md:top-[24vh] md:h-fit md:w-[clamp(15rem,24vw,21rem)]"
        >
          <div ref={frameRef} className="st-cover-stack">
            {projects.map((project, index) => (
              <div
                key={project.slug}
                data-cover=""
                data-on={index === active}
                className="st-cover bg-[var(--paper)]"
              >
                <div data-cover-inner="">
                  <Shot
                    src={project.cover}
                    alt=""
                    ratio="16 / 10"
                    label="cover, 16:10"
                    sizes="(max-width: 48rem) 100vw, 21rem"
                  />
                  <p className="st-display st-display-reg mt-[0.7rem] mb-0 text-[clamp(1.3rem,3vw,2rem)] tabular-nums">
                    {String(index + 1).padStart(2, '0')} /{' '}
                    {String(projects.length).padStart(2, '0')}
                  </p>
                  <p className="st-meta mt-[0.2rem] mb-0">
                    {project.summary}
                    <br />
                    {project.kind.toLowerCase()},{' '}
                    <span className="tabular-nums">{project.year}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
