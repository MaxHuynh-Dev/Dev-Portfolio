'use client';

import Shot from '@Components/Shot';
import { shortest, useCarousel } from '@Hooks/useCarousel';
import Link from 'next/link';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PROJECTS, WORK_RANGE } from '@/content/site';
import Readout from './Readout';
import Roll from './Roll';

/**
 * Every project, on a ring.
 *
 * The covers hang on the rim of a circle whose centre is far below the
 * page, so the one in the middle stands upright and the rest fall away and
 * tilt with the curve. The wheel, a drag or the arrow keys turn it; it
 * settles on a whole project when the input stops, and it wraps, so the
 * last project leads back to the first.
 *
 * Nothing here is drawn on a canvas. The curve is eight transforms — a
 * point on a circle and the tangent at that point — which is the same
 * picture WebGL would produce, minus the dependency this project has now
 * turned down twice.
 *
 * The page is exactly one screen tall and does not scroll while the ring is
 * up, because the ring is what the wheel is driving. That is a real cost,
 * and the `list` view beside it is the answer: same projects, ordinary
 * page, ordinary scrolling.
 */

/** Degrees of the ring between one project and the next. */
const STEP_DEG = 8;

/** Centre-to-centre spacing along the rim, as a multiple of a cover's width. */
const PITCH_RATIO = 1.14;

/** How much of its size a cover loses per step away from the middle. */
const SHRINK = 0.135;

/**
 * Where the ring fades out, at most.
 *
 * This is not about running out of screen — the covers run off the sides
 * long before this and the clip deals with that. It exists for one thing:
 * the seam where the ring wraps onto its own back, at half the list away
 * from the middle. Fading in front of the seam is what keeps a cover from
 * appearing out of nothing in the middle of the page on a short list.
 */
const FADE_FROM = 3.5;

/** How long the fade takes, in projects. */
const FADE_OVER = 0.6;

/** A cover is 4:5, so it is this many times as tall as it is wide. */
const TALL = 1.25;

/** Widest a cover is allowed to get, in px, however much room there is. */
const COVER_MAX = 420;

/**
 * How much of the next cover along has to stay on screen, as a share of
 * its own width.
 *
 * This is what stops the ring from becoming one card on a phone. A cover
 * `steps` out sits `PITCH_RATIO` widths along the rim per step, so the
 * part of its neighbour still showing past the middle one is
 * `screen / 2 - (PITCH_RATIO - 0.5) * width`; requiring that to be at
 * least `PEEK` widths solves for a width cap, which is the rule below.
 * A fraction of the screen picked by eye at one size would be wrong at
 * the other — this one is the same promise at every width.
 */
const PEEK = 0.28;

/** As deep as the ring is ever asked to reserve room for. */
const STEPS_MAX = 3;

/** And narrowest, before the label on an empty field stops fitting. */
const COVER_MIN = 88;

const RAD = Math.PI / 180;

/** Where the fade starts, never further round than the seam itself. */
const fadeFor = (count: number): number => Math.min(FADE_FROM, (count - 1) / 2);

/**
 * The vertical room the ring needs, as a multiple of a cover's width — the
 * cover itself, plus how far the cover `reach` steps out has dropped
 * below it.
 *
 * Solved rather than guessed, so the ring fits a short viewport by
 * shrinking the covers instead of running off the bottom of the screen.
 */
const verticalFor = (reach: number): number =>
  TALL + (PITCH_RATIO * (1 - Math.cos(reach * STEP_DEG * RAD))) / Math.sin(STEP_DEG * RAD);

/** Is the cover `steps` out from the middle still on screen at all? */
const reaches = (width: number, steps: number, screen: number): boolean =>
  (width * PITCH_RATIO * Math.sin(steps * STEP_DEG * RAD)) / Math.sin(STEP_DEG * RAD) - width / 2 <
  screen / 2;

/**
 * The cover width that fills the stage exactly.
 *
 * The ring only has to make room below itself for the covers that are
 * actually on screen, and how many those are depends on how wide a cover
 * is — which is the thing being solved for. So it is climbed rather than
 * guessed: start one step deep, and go deeper only while the next cover
 * out would still be on screen at the size that answer produced. On a
 * phone it stops at one, on a desktop at two, and a fraction tuned at one
 * width is never carried to the other.
 */
const solveCover = (box: DOMRect): { width: number; fitted: number } => {
  const cap = Math.min(box.width / (2 * (PITCH_RATIO - 0.5 + PEEK)), COVER_MAX);
  let fitted = 1;
  let width = Math.min(cap, box.height / verticalFor(fitted));
  while (fitted < STEPS_MAX && reaches(width, fitted + 1, box.width)) {
    fitted += 1;
    width = Math.min(cap, box.height / verticalFor(fitted));
  }
  return { width: Math.max(COVER_MIN, width), fitted };
};

type Mode = 'wheel' | 'list';

export default function Library(): React.ReactElement {
  const [mode, setMode] = useState<Mode>('wheel');

  // The two elements the engine drives, held as state rather than refs:
  // the ring is unmounted in the list view, and an effect that has to
  // re-attach its listeners needs the arrival of a new element to be a
  // dependency it can actually see.
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [links, setLinks] = useState<HTMLOListElement | null>(null);
  const covers = useRef<(HTMLLIElement | null)[]>([]);
  /** Centre-to-centre spacing in px, derived from the measured cover width. */
  const pitch = useRef(0);

  const draw = useCallback((position: number): void => {
    if (pitch.current === 0) return;
    const radius = pitch.current / Math.sin(STEP_DEG * RAD);
    const fade = fadeFor(PROJECTS.length);

    for (let index = 0; index < PROJECTS.length; index += 1) {
      const element = covers.current[index];
      if (element === null || element === undefined) continue;

      const away = shortest(index - position, PROJECTS.length);
      const angle = away * STEP_DEG;
      const x = radius * Math.sin(angle * RAD);
      const y = radius * (1 - Math.cos(angle * RAD));
      const scale = Math.max(0.2, 1 - Math.abs(away) * SHRINK);
      const shown = Math.min(1, Math.max(0, (fade - Math.abs(away)) / FADE_OVER));

      element.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), ${y.toFixed(
        2
      )}px, 0) rotate(${angle.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      element.style.opacity = shown.toFixed(3);
      // A cover nobody can see must not take a click either. It stays
      // focusable, though: tabbing onto it is what brings it round.
      element.style.pointerEvents = shown < 0.05 ? 'none' : '';
      element.style.zIndex = String(50 - Math.round(Math.abs(away) * 10));
    }
  }, []);

  const carousel = useCarousel({
    count: PROJECTS.length,
    onFrame: draw,
    enabled: mode === 'wheel',
    surface,
    links
  });

  const { redraw } = carousel;

  /**
   * One measurement in, one cover width out, and the spacing follows from
   * it. Nothing here reads a cover's own box, so the feedback loop that
   * makes a ResizeObserver oscillate cannot start: the covers are absolutely
   * positioned, so the width written below does not move the element being
   * observed.
   */
  const measure = useCallback((): void => {
    if (surface === null) return;
    const box = surface.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) return;

    const { width, fitted } = solveCover(box);
    // On a tall narrow screen the width cap wins and the ring does not need
    // the whole stage. Hang it in the middle of what is left rather than
    // from the top, or it sits high with a band of nothing under it.
    const slack = Math.max(0, box.height - width * verticalFor(fitted));

    surface.style.setProperty('--cover', `${width}px`);
    surface.style.setProperty('--ring-top', `${(slack / 2).toFixed(1)}px`);
    pitch.current = width * PITCH_RATIO;
    redraw();
  }, [surface, redraw]);

  useEffect(() => {
    if (surface === null) return;

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    return () => {
      observer.disconnect();
    };
  }, [surface, measure]);

  const frame =
    mode === 'wheel'
      ? 'flex h-[100dvh] flex-col px-[var(--gut)] pt-[var(--chrome-top)] pb-[calc(var(--chrome-top)+0.5rem)]'
      : 'flex min-h-[100dvh] flex-col px-[var(--gut)] pt-[var(--chrome-top)] pb-[calc(var(--chrome-top)+0.5rem)]';

  return (
    <section aria-labelledby="library-heading" className={frame}>
      <header className="flex items-baseline justify-between gap-6">
        <h1 id="library-heading" className="st-meta m-0 font-[500] text-[var(--ink)]">
          all work
        </h1>
        <p className="st-meta tabular-nums">{WORK_RANGE}</p>
      </header>

      <div className="mt-[0.3rem] flex items-baseline justify-between gap-6">
        {/* Two buttons rather than a tab strip: they change how the same
            list is drawn, not which list is shown, and aria-pressed is the
            thing that says which one is on. Never appearance alone. */}
        <p className="st-meta flex items-baseline">
          <button
            type="button"
            aria-label="Show the work as a wheel"
            aria-pressed={mode === 'wheel'}
            onClick={() => {
              setMode('wheel');
            }}
            className={mode === 'wheel' ? 'st-link text-[var(--ink)]' : 'text-[var(--ink-2)]'}
          >
            wheel
          </button>
          <span aria-hidden="true" className="pr-[0.3rem]">
            ,
          </span>
          <button
            type="button"
            aria-label="Show the work as a list"
            aria-pressed={mode === 'list'}
            onClick={() => {
              setMode('list');
            }}
            className={mode === 'list' ? 'st-link text-[var(--ink)]' : 'text-[var(--ink-2)]'}
          >
            list
          </button>
        </p>

        {mode === 'wheel' ? <p className="st-meta">drag or scroll</p> : null}
      </div>

      <div className="mt-[clamp(1.2rem,4vh,2.8rem)]">
        <Readout active={carousel.active} />
      </div>

      {mode === 'wheel' ? (
        <div
          ref={setSurface}
          // Full-bleed and clipped: the outermost covers are meant to run
          // off the sides of the screen, and the clip is also what keeps
          // the ones that have dropped below the ring from lengthening the
          // page. `clip`, never `hidden` — see the note in global.css.
          className="relative -mx-[var(--gut)] mt-[clamp(0.8rem,3vh,2rem)] flex-1 cursor-grab touch-none overflow-clip"
        >
          <ol ref={setLinks} className="m-0 list-none p-0">
            {PROJECTS.map((project, index) => (
              <li
                key={project.slug}
                ref={(node) => {
                  covers.current[index] = node;
                }}
                className="absolute top-[var(--ring-top,0px)] left-1/2 w-[var(--cover,8rem)]"
              >
                <Link
                  href={`/work/${project.slug}`}
                  data-transition-label={project.name}
                  onFocus={() => {
                    carousel.goTo(index);
                  }}
                  className="block"
                >
                  {/* Decorative: the link's name is spelled out below, and
                      an empty field has nothing to describe in the first
                      place. */}
                  <Shot
                    src={project.cover}
                    alt=""
                    ratio="4 / 5"
                    label="cover, 4:5"
                    sizes="(max-width: 48rem) 45vw, 14rem"
                  />
                  <span className="sr-only">
                    {project.name}. {project.summary} {project.kind}, {project.year}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="mt-[clamp(1.5rem,5vh,3rem)]">
          <Roll active={carousel.active} onActive={carousel.goTo} />
        </div>
      )}
    </section>
  );
}
