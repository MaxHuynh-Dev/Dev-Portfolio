'use client';

import Headline from '@Components/Headline';
import Reveal from '@Components/Reveal';
import Shot from '@Components/Shot';
import { useFittedText } from '@Hooks/useFittedText';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Project, Size } from '@/content/site';

/**
 * The shape of an EMPTY field, and only of an empty field.
 *
 * A real shot is laid out at its own proportions — full width, height auto
 * — because a screenshot cropped to a shape somebody chose is a screenshot
 * with its edges missing, and the edges are usually where the layout being
 * shown off actually is. There is nothing to read off a field that has no
 * image in it, so it still needs a declared shape, and `tall` still breaks
 * the rhythm of a stack of them.
 */
const RATIO = { wide: '16 / 10', tall: '4 / 5' } as const;

/** The shape to give a box that stands in for a shot, measured or not. */
const shapeOf = (size: Size | null, tall: boolean): string =>
  size === null ? (tall ? RATIO.tall : RATIO.wide) : `${size.width} / ${size.height}`;

/**
 * The media column, and the rail beside it.
 *
 * They are one component because they share a single piece of state — which
 * shot is currently at eye level — and splitting them across the layout
 * would mean lifting that into a context for two consumers.
 *
 * The rail is a real navigation control, not a progress decoration: each
 * thumbnail is a button that scrolls to its shot, and the current one
 * carries `aria-current`, so the state is not carried by appearance alone.
 *
 * The outline around the current thumbnail is NOT on the thumbnail. It is
 * one marker, placed every frame from a continuous read of where the reader
 * is between two shots, so it slides with the scroll instead of hopping
 * when a shot's centre crosses the middle of the screen. Putting it on the
 * button meant it could only ever be in one of N places: measured on a
 * two-shot project, the outline took exactly two positions and moved in a
 * single 29.5px jump, while the reader's real position moved smoothly, at
 * most 0.08 of a shot per frame. That gap is what reads as a stutter.
 *
 * Which is also why the thumbnails touch. They used to sit 0.4rem apart,
 * and a frame that can stand between two of them then spends half its time
 * framing a strip of bare paper — it looks misaligned, because a frame
 * claims to be around something. With the gap gone the rail is one strip
 * and the marker is a window onto it: at rest it is exactly around a
 * thumbnail, and in between it is exactly around the part of each you are
 * between. Nothing it can ever be around is nothing.
 *
 * The marker is written directly, not through React state. `active` is
 * still state, because `aria-current` has to be in the DOM for assistive
 * technology, but it changes a handful of times per page rather than sixty
 * times a second.
 */
export default function ShotStack({
  project,
  shotSizes
}: {
  project: Project;
  /**
   * Each shot's real pixels, measured on the server, positional with
   * `project.shots`. Null where there is no file to measure — an empty
   * field, or an image that could not be read — and the declared ratio
   * carries it instead.
   */
  shotSizes: (Size | null)[];
}): React.ReactElement {
  const [active, setActive] = useState(0);
  const stackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLSpanElement>(null);

  // The project name, fitted to the media column rather than guessed at
  // with a clamp. Names here run from four characters to thirty, and a
  // fixed scale is either timid for the short ones or overflowing for the
  // long ones. Same engine as the masthead.
  const { ref: nameRef } = useFittedText(project.name, {
    maxViewportFraction: 0.3
  });

  useEffect(() => {
    const figures = Array.from(
      stackRef.current?.querySelectorAll<HTMLElement>('[data-shot]') ?? []
    );
    if (figures.length === 0) return;

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduce = motion.matches;
    const onQuery = (): void => {
      reduce = motion.matches;
    };
    motion.addEventListener('change', onQuery);

    let frame = 0;
    /** Each thumbnail's place in the rail. Layout, so read on resize only. */
    let slots: { top: number; height: number }[] = [];

    const readSlots = (): void => {
      const rail = railRef.current;
      if (rail === null) return;
      // Rects, not offsetTop/offsetHeight. Those round to whole pixels, and
      // a thumbnail here is 23.4px tall at desktop — so the marker parked
      // 0.48px high and 0.28px short of the thumbnail it was supposed to be
      // sitting on. The rail never moves relative to its own children, so
      // one reading of both is good until the layout changes.
      const railBox = rail.getBoundingClientRect();
      slots = Array.from(rail.querySelectorAll<HTMLElement>('[data-thumb]')).map((thumb) => {
        const box = thumb.getBoundingClientRect();
        return { top: box.top - railBox.top, height: box.height };
      });
    };

    /**
     * Where the reader is, in shot units, as a float.
     *
     * The middle of the screen falls between two shot centres; how far
     * between them is the fraction. Outside the first and last it clamps,
     * so the marker parks on an end rather than running off the rail.
     */
    const position = (): number => {
      const middle = window.innerHeight / 2;
      const centres = figures.map((figure) => {
        const box = figure.getBoundingClientRect();
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

    const measure = (): void => {
      frame = 0;
      const at = position();

      const marker = markerRef.current;
      if (marker !== null && slots.length > 0) {
        // Under `reduce` the marker stands on whole shots. It is answering
        // the reader's own scroll, so it is allowed to move at all — but a
        // thing gliding continuously under the pointer is the query's case,
        // and the discrete version says exactly as much.
        const on = reduce ? Math.round(at) : at;
        const first = Math.min(slots.length - 1, Math.floor(on));
        const next = Math.min(slots.length - 1, first + 1);
        const part = on - first;
        const top = slots[first].top + (slots[next].top - slots[first].top) * part;
        const height = slots[first].height + (slots[next].height - slots[first].height) * part;
        marker.style.transform = `translateY(${top.toFixed(2)}px)`;
        marker.style.height = `${height.toFixed(2)}px`;
      }

      // Rounding the same number the marker uses, rather than taking the
      // nearest centre separately: two ways of deciding which shot is
      // current can disagree, and then the outline sits on one thumbnail
      // while aria-current names another.
      setActive(Math.round(at));
    };

    const schedule = (): void => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(measure);
    };

    const relayout = (): void => {
      readSlots();
      schedule();
    };

    readSlots();
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', relayout);
    // The fitted name above the stack settles when the face arrives, which
    // moves every shot on the page and therefore every centre.
    void document.fonts.ready.then(relayout);

    return () => {
      motion.removeEventListener('change', onQuery);
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', relayout);
    };
  }, []);

  const goTo = (index: number): void => {
    const target = stackRef.current?.querySelector<HTMLElement>(`[data-shot="${index}"]`);
    if (!target) return;
    // Lenis does not honour scroll-padding-top; read the declared value so
    // the two cannot drift.
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    if (window.lenis) {
      window.lenis.scrollTo(target, { offset: -padding });
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex min-w-0 flex-1 gap-[clamp(0.75rem,2vw,2rem)]">
      <div ref={stackRef} className="min-w-0 flex-1">
        {/* The name sits over the first shot. It is the page's h1: the
            spec sheet above it is supporting material, and a heading this
            size pretending to be decorative while a hidden one carries the
            outline would be the worse arrangement.

            Masked on BOTH paths, unlike the index's masthead. The exception
            there is the preloader's pixel-exact handover of the name, and
            there is no such handover here: reloading a project page still
            gets the curtain, but its letters have no masthead to land on,
            so they solve against the column and simply clear (trap 10). */}
        <h1
          ref={nameRef as React.RefObject<HTMLHeadingElement>}
          className="st-display st-fit relative z-10 m-0 whitespace-nowrap text-[var(--ink)]"
        >
          <Headline delay={40}>{project.name}</Headline>
        </h1>

        <div className="mt-[-0.22em] flex flex-col gap-[clamp(2rem,6vw,5rem)]">
          {project.shots.map((shot, index) => {
            const media = (
              <Shot
                src={shot.src}
                alt={shot.alt}
                size={shotSizes[index] ?? null}
                ratio={shot.tall === true ? RATIO.tall : RATIO.wide}
                label={`shot ${String(index + 1).padStart(2, '0')}, ${shot.tall === true ? '4:5' : '16:10'}`}
                sizes="(max-width: 63.99rem) 100vw, 46rem"
                priority={index === 0}
              />
            );

            return (
              <figure
                // biome-ignore lint/suspicious/noArrayIndexKey: shots are positional, and two may share a src of null
                key={index}
                data-shot={index}
                className="m-0"
              >
                {/* ONLY the first one, and only on arrival. The rest are
                    reached by scrolling, and a shot that washed in as it
                    came into view would be the fade-up on every block
                    wearing a new hat. An image has no lines to mask, so
                    this one carries no movement at all — the name beside it
                    is doing that. The others are not wrapped at all rather
                    than wrapped and switched off, so the stack's markup
                    says which shot is special. */}
                {index === 0 ? (
                  <Reveal on="load" className="st-wash block" delay={260}>
                    {media}
                  </Reveal>
                ) : (
                  media
                )}
              </figure>
            );
          })}
        </div>
      </div>

      {/* Below md the rail would be smaller than a touch target and would
          steal width the shots need. */}
      <nav aria-label="Shots" className="hidden shrink-0 lg:block">
        {/* `sticky` is a positioned box, so the marker resolves against this
            and rides with it — and each thumbnail's offsetTop is measured
            against it too, which is what the marker is placed from. */}
        <div ref={railRef} className="sticky top-[24vh]">
          {/* The position readout. Hidden, because it reports the same
              thing aria-current already carries, and pointer-transparent,
              because the buttons underneath are the control. */}
          {/* The offset is negative so the frame is drawn inside its own
              box: on a strip with no gaps, an outline sitting outside would
              bleed two pixels onto the neighbours it is not pointing at. */}
          <span
            ref={markerRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-10 outline-2 outline-[var(--ink)] outline-offset-[-2px]"
          />
          <ol className="m-0 flex list-none flex-col p-0">
            {project.shots.map((shot, index) => (
              <li
                // biome-ignore lint/suspicious/noArrayIndexKey: shots are positional
                key={index}
              >
                <button
                  type="button"
                  data-thumb=""
                  aria-current={index === active ? 'true' : undefined}
                  aria-label={`Shot ${index + 1} of ${project.shots.length}`}
                  onClick={() => {
                    goTo(index);
                  }}
                  // The rail is a miniature of the column, so a thumbnail
                  // is the shot's own shape too. The marker already
                  // interpolates its height between two slots, which is
                  // what lets them differ.
                  style={{
                    aspectRatio: shapeOf(shotSizes[index] ?? null, shot.tall === true)
                  }}
                  className="relative block w-[2.4rem] bg-[var(--well)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--ink)]"
                >
                  {shot.src !== null ? (
                    <Image src={shot.src} alt="" fill sizes="48px" className="object-cover" />
                  ) : null}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </nav>
    </div>
  );
}
