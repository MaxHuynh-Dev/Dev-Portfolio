'use client';

import Shot from '@Components/Shot';
import { shortest, useCarousel } from '@Hooks/useCarousel';
import Link from 'next/link';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PROJECTS, WORK_RANGE } from '@/content/site';
import Readout from './Readout';
import Roll from './Roll';
import { GATHER_MS } from './timing';

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

/**
 * A cover is 16:9, so it is this many times as tall as it is wide.
 *
 * It is the one number the whole ring is sized against — the vertical
 * budget, the width cap and how deep the ring is drawn all resolve through
 * it — so changing the shape of a cover is changing this and the `ratio`
 * on the Shot below, and nothing else.
 */
const TALL = 9 / 16;

/**
 * Narrowest a cover may be before the ring stops being worth looking at.
 *
 * The covers are screenshots of websites. Below about this, a screenshot
 * is a grey rectangle — so on a small screen the ring gives up depth
 * before it gives up this, and `PEEK` below is the only thing allowed to
 * push under it.
 */
const COVER_READABLE = 200;

/**
 * How much of the next cover along shows past the middle one, as a share
 * of a cover's width.
 *
 * `PEEK` is the least the ring will settle for and `WHOLE` is what it asks
 * for first — a whole cover's width clear of the middle one, which is what
 * makes three separate covers rather than one slab with two edges.
 *
 * Both are the same piece of arithmetic. A cover `steps` out sits
 * `PITCH_RATIO` widths along the rim per step, so the part of the
 * neighbour still showing is `screen / 2 - (PITCH_RATIO - 0.5) * width`;
 * requiring that to be at least `share` widths solves for a width cap.
 * Expressing it this way rather than as a fraction of the screen is what
 * makes it the same promise at 320 and at 1440.
 */
const PEEK = 0.28;
const WHOLE = 1;

/** The widest cover leaving `share` of a cover's width of its neighbour. */
const capFor = (screen: number, share: number): number =>
  screen / (2 * (PITCH_RATIO - 0.5 + share));

/** As deep as the ring is ever asked to reserve room for. */
const STEPS_MAX = 3;

const RAD = Math.PI / 180;

/** Where the fade starts, never further round than the seam itself. */
const fadeFor = (count: number): number => Math.min(FADE_FROM, (count - 1) / 2);

/** How far along the rim the cover `steps` out has dropped, per unit width. */
const dipFor = (steps: number): number =>
  (PITCH_RATIO * (1 - Math.cos(steps * STEP_DEG * RAD))) / Math.sin(STEP_DEG * RAD);

/**
 * Half the bounding box of a cover `steps` out, per unit width.
 *
 * A cover is turned as well as dropped, and a turned box is bigger than
 * the box it came from: `w x h` at angle `a` occupies `h·cos a + w·sin a`
 * tall and `w·cos a + h·sin a` wide. Leaving that out is only a rounding
 * error while the covers are portrait and becomes a real one the moment
 * they are landscape — a wide box gives up far more to a turn than a tall
 * one does. It was measured as exactly the 14px the outer covers were
 * clipped by at 1440 after the change to 16:9.
 */
const halfFor = (steps: number): { tall: number; wide: number } => {
  const angle = steps * STEP_DEG * RAD;
  const scale = Math.max(0.2, 1 - steps * SHRINK) / 2;
  return {
    tall: scale * (TALL * Math.cos(angle) + Math.sin(angle)),
    wide: scale * (Math.cos(angle) + TALL * Math.sin(angle))
  };
};

/**
 * The vertical room the ring needs, as a multiple of a cover's width: how
 * far the lowest edge of any drawn cover reaches below the top of the ring.
 *
 * Solved rather than guessed, so the ring fits a short viewport by
 * shrinking the covers instead of running off the bottom of the screen.
 * Taken as a maximum over the whole steps the covers actually sit on,
 * because with the turn folded in the deepest one is not always the
 * furthest one out.
 */
const verticalFor = (reach: number): number => {
  let deepest = TALL;
  for (let steps = 1; steps <= reach; steps += 1) {
    deepest = Math.max(deepest, dipFor(steps) + TALL / 2 + halfFor(steps).tall);
  }
  return deepest;
};

/** Is the cover `steps` out from the middle still on screen at all? */
const reaches = (width: number, steps: number, screen: number): boolean =>
  (width * PITCH_RATIO * Math.sin(steps * STEP_DEG * RAD)) / Math.sin(STEP_DEG * RAD) -
    width * halfFor(steps).wide <
  screen / 2;

/**
 * How wide a cover is, and how deep the ring is drawn.
 *
 * Four things want a say and they are applied in the order they matter:
 *
 * - the stage height, so nothing runs off the bottom;
 * - a whole neighbour clear of the middle cover, which is what the ring
 *   reads as — this is the one that binds on a desktop, where filling the
 *   height instead gives a 686px slab with its neighbours shoved off both
 *   edges;
 * - `COVER_READABLE`, because a screenshot below it shows nothing, which
 *   is what pulls a phone back up from the 110px the whole-neighbour rule
 *   would ask for;
 * - and `PEEK` last, with the final say, because a ring with no visible
 *   neighbour at all is not a ring. It is the only rule allowed to push a
 *   cover under `COVER_READABLE`, and on a 320 screen it has to.
 *
 * How deep the ring goes is climbed rather than guessed, because the room
 * to reserve below it depends on how many covers are on screen, which
 * depends on the width being solved for: start one step deep and go deeper
 * only while the next cover out would still be on screen at the answer
 * that produced.
 */
const solveCover = (box: DOMRect): { width: number; fitted: number } => {
  const peek = capFor(box.width, PEEK);
  const whole = capFor(box.width, WHOLE);
  const solve = (steps: number): number =>
    Math.min(peek, Math.max(COVER_READABLE, Math.min(whole, box.height / verticalFor(steps))));

  let fitted = 1;
  let width = solve(fitted);
  while (fitted < STEPS_MAX && reaches(width, fitted + 1, box.width)) {
    fitted += 1;
    width = solve(fitted);
  }
  return { width, fitted };
};

/**
 * How far a cover in the gathered stack leans, per project away from the
 * one on top, and how far back that lean is allowed to go.
 *
 * The stack is a deck, not a pile of one card: the ones underneath have to
 * show an edge or the gather has nothing to land as.
 */
const STACK_TILT = 1.6;
const STACK_DEPTH = 4;

/** Where in the gather the covers behind the top one start to go. */
const STACK_FADE_FROM = 0.55;

/** Ease for the gather — out hard, so it reads as arriving, not drifting. */
const ease = (t: number): number => 1 - (1 - t) ** 3;

/** Smooth 0..1 across a window, for fading one thing inside another. */
const across = (value: number, from: number, to: number): number =>
  Math.min(1, Math.max(0, (value - from) / (to - from)));

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

type Mode = 'wheel' | 'list';

export default function Library(): React.ReactElement {
  const [mode, setMode] = useState<Mode>('wheel');

  // The elements the engine drives, held as state rather than refs so that
  // an effect which has to re-attach listeners can depend on the arrival of
  // the element itself, which a ref cannot say.
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [links, setLinks] = useState<HTMLOListElement | null>(null);
  const [readout, setReadout] = useState<HTMLDivElement | null>(null);
  /** The box in the list the covers gather into. Empty, and measured. */
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  const covers = useRef<(HTMLLIElement | null)[]>([]);
  /** Each mask in the readout, and its eight stacked lines in list order. */
  const rolls = useRef<HTMLElement[][]>([]);
  /** Centre-to-centre spacing in px, derived from the measured cover width. */
  const pitch = useRef(0);
  /** A cover's width in px, which the stack scales against. */
  const cover = useRef(0);
  /** How far down the stage the ring hangs, once its slack is shared out. */
  const ringTop = useRef(0);

  /**
   * 0 on the ring, 1 in the stack, and every value between is the gather.
   *
   * A ref and not state: it moves every frame and the only thing that reads
   * it is `draw`. The blend loop below just asks the carousel to paint
   * again, so there is one code path placing the covers however they are
   * being driven — a wheel gesture, a keyboard press, or this.
   */
  const blend = useRef(0);
  const blendTo = useRef(0);

  const draw = useCallback(
    (position: number): void => {
      // The readout rolls WITH the ring, not after it. Every line is placed
      // from the same continuous position the covers are, so half a turn of
      // the wheel leaves the name half out of its mask — where parking each
      // line on the nearest whole project and transitioning between the two
      // poses could only ever start moving once the ring had already
      // arrived. One number drives both, and there is no timeline to fall
      // behind.
      for (const roll of rolls.current) {
        for (let index = 0; index < roll.length; index += 1) {
          const away = shortest(index - position, roll.length);
          roll[index].style.transform = `translateY(${(away * 110).toFixed(2)}%)`;
        }
      }

      if (pitch.current === 0) return;
      const radius = pitch.current / Math.sin(STEP_DEG * RAD);
      const fade = fadeFor(PROJECTS.length);

      // Where the stack is, measured off the empty slot in the list rather
      // than positioned by a second set of numbers that would have to be kept
      // in step with the list's own layout. Read once per frame, not once per
      // cover, and only while there is a gather to draw.
      const gather = ease(blend.current);
      let stack = null as { x: number; y: number; scale: number } | null;
      if (gather > 0 && slot !== null && surface !== null && cover.current > 0) {
        const box = slot.getBoundingClientRect();
        const frame = surface.getBoundingClientRect();
        const scale = box.width / cover.current;
        stack = {
          x: box.left + box.width / 2 - (frame.left + frame.width / 2),
          // `scale()` shrinks about the element's centre, so a cover
          // translated to the slot's top and then scaled down sits lower
          // than the slot by half of what it gave up: h(1 - scale) / 2.
          // Measured at 34.6px with a 434px cover landing in a 311px slot,
          // which is exactly how far the stack was off. The x needs no such
          // correction: it is centred, and the centre is the thing scaling
          // holds still.
          y: box.top - frame.top - (cover.current * TALL * (1 - scale)) / 2,
          scale
        };
      }
      const centre = Math.round(position);

      for (let index = 0; index < PROJECTS.length; index += 1) {
        const element = covers.current[index];
        if (element === null || element === undefined) continue;

        const away = shortest(index - position, PROJECTS.length);
        const angle = away * STEP_DEG;
        let x = radius * Math.sin(angle * RAD);
        let y = ringTop.current + radius * (1 - Math.cos(angle * RAD));
        let turn = angle;
        let scale = Math.max(0.2, 1 - Math.abs(away) * SHRINK);
        let shown = Math.min(1, Math.max(0, (fade - Math.abs(away)) / FADE_OVER));

        if (stack !== null) {
          // Depth in the deck is taken from the settled project, not the
          // continuous position: a stack whose cards re-order mid-flight
          // shuffles instead of gathering.
          const depth = shortest(index - centre, PROJECTS.length);
          const lean = Math.max(-STACK_DEPTH, Math.min(STACK_DEPTH, depth)) * STACK_TILT;
          x = mix(x, stack.x, gather);
          y = mix(y, stack.y, gather);
          turn = mix(turn, lean, gather);
          scale = mix(scale, stack.scale, gather);
          // The deck resolves into one card at the end. Until then every
          // cover is visible, which is what makes the gather legible as
          // eight things arriving rather than one thing appearing.
          const alone = across(gather, STACK_FADE_FROM, 1);
          shown = mix(shown, depth === 0 ? 1 : 0, alone);
        }

        element.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), ${y.toFixed(
          2
        )}px, 0) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        element.style.opacity = shown.toFixed(3);
        // A cover nobody can see must not take a click either. It stays
        // focusable, though: tabbing onto it is what brings it round.
        element.style.pointerEvents = shown < 0.05 ? 'none' : '';
        element.style.zIndex = String(
          stack === null
            ? 50 - Math.round(Math.abs(away) * 10)
            : 50 - Math.abs(shortest(index - centre, PROJECTS.length))
        );
      }
    },
    [slot, surface]
  );

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
    pitch.current = width * PITCH_RATIO;
    cover.current = width;
    // The covers sit at the top of the surface and are moved entirely by
    // transform, so the slack is carried here rather than as a CSS offset:
    // a `top` the transform does not know about is a second opinion about
    // where the ring is, and the gather has to interpolate from one place.
    ringTop.current = slack / 2;
    redraw();
  }, [surface, redraw]);

  // The readout is mounted in both views and never re-renders, so its lines
  // are collected once and written to directly from `draw`.
  useEffect(() => {
    if (readout === null) {
      rolls.current = [];
      return;
    }
    rolls.current = Array.from(readout.querySelectorAll<HTMLElement>('.st-roll')).map(
      (roll) => Array.from(roll.children) as HTMLElement[]
    );
    redraw();
  }, [readout, redraw]);

  useEffect(() => {
    if (surface === null) return;

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(surface);
    return () => {
      observer.disconnect();
    };
  }, [surface, measure]);

  /**
   * The gather, and the only other thing that moves a cover.
   *
   * It does not place anything itself — it walks `blend` and asks the
   * carousel to paint again, so a cover has exactly one piece of code
   * deciding where it goes however it is being driven. The easing is
   * applied in `draw`, which is why the walk here is linear.
   *
   * Under `reduce` it is assigned rather than walked: eight covers flying
   * across the page is the query's central case, and the list's own rise is
   * a CSS transition the reduced-motion block has already flattened.
   */
  useEffect(() => {
    const target = mode === 'list' ? 1 : 0;
    blendTo.current = target;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      blend.current = target;
      redraw();
      return;
    }

    const from = blend.current;
    const distance = Math.abs(target - from);
    if (distance < 0.001) return;

    const ms = GATHER_MS * distance;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now: number): void {
      const t = Math.min(1, (now - start) / ms);
      blend.current = from + (target - from) * t;
      redraw();
      if (t < 1) frame = requestAnimationFrame(step);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [mode, redraw]);

  const shown = mode === 'list';

  return (
    <section
      aria-labelledby="library-heading"
      className="relative flex h-[100dvh] flex-col px-[var(--gut)] pt-[var(--chrome-top)] pb-[calc(var(--chrome-top)+0.5rem)]"
    >
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
            aria-pressed={!shown}
            onClick={() => {
              setMode('wheel');
            }}
            className={shown ? 'text-[var(--ink-2)]' : 'st-link text-[var(--ink)]'}
          >
            wheel
          </button>
          <span aria-hidden="true" className="pr-[0.3rem]">
            ,
          </span>
          <button
            type="button"
            aria-label="Show the work as a list"
            aria-pressed={shown}
            onClick={() => {
              setMode('list');
            }}
            className={shown ? 'st-link text-[var(--ink)]' : 'text-[var(--ink-2)]'}
          >
            list
          </button>
        </p>

        {shown ? null : <p className="st-meta">drag or scroll</p>}
      </div>

      <div ref={setReadout} className="mt-[clamp(1.2rem,4vh,2.8rem)]">
        <Readout />
      </div>

      {/* One stage, both views. They are overlaid rather than laid out one
          after the other so that switching reflows nothing: the ring keeps
          the box it solved against, and the covers can fly to a slot that
          has not moved under them. */}
      <div className="relative mt-[clamp(0.8rem,3vh,2rem)] flex-1">
        <div
          aria-hidden={!shown}
          inert={!shown}
          data-lenis-prevent=""
          onScroll={redraw}
          className={
            shown
              ? 'st-quiet-scroll absolute inset-0 overflow-y-auto'
              : 'pointer-events-none absolute inset-0 overflow-clip'
          }
        >
          <div className="flex flex-col gap-[clamp(0.6rem,2vh,2rem)] md:flex-row md:items-start md:gap-[clamp(1.5rem,4vw,3.5rem)]">
            <div className="order-2 min-w-0 flex-1 md:order-1">
              <Roll active={carousel.active} shown={shown} onActive={carousel.goTo} />
            </div>

            {/* Where the covers gather, and nothing else. Empty, because
                the cover layer below draws the real thing into it, and
                hidden, because it is a picture of the row the list has
                already named. Its box is measured every frame of the
                gather, so the list owns where the stack ends up and this
                file never has a second opinion about it. */}
            <div
              ref={setSlot}
              aria-hidden="true"
              style={{ aspectRatio: '16 / 9' }}
              className="order-1 w-[clamp(8rem,36vw,20rem)] shrink-0 self-center md:order-2 md:self-start"
            />
          </div>
        </div>

        {/* The covers, last so they paint over the slot, full-bleed so the
            ring can run off the sides of the screen, and clipped so the
            ones that have dropped below the ring cannot lengthen the page.
            `clip`, never `hidden` — see the note in global.css. */}
        <div
          ref={setSurface}
          aria-hidden={shown}
          inert={shown}
          className={
            shown
              ? 'pointer-events-none absolute inset-y-0 right-[calc(var(--gut)*-1)] left-[calc(var(--gut)*-1)] overflow-clip'
              : 'absolute inset-y-0 right-[calc(var(--gut)*-1)] left-[calc(var(--gut)*-1)] cursor-grab touch-none overflow-clip'
          }
        >
          <ol ref={setLinks} className="m-0 list-none p-0">
            {PROJECTS.map((project, index) => (
              <li
                key={project.slug}
                ref={(node) => {
                  covers.current[index] = node;
                }}
                className="absolute top-0 left-1/2 w-[var(--cover,8rem)]"
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
                    ratio="16 / 9"
                    label="cover, 16:9"
                    sizes="(max-width: 48rem) 60vw, 28rem"
                  />
                  <span className="sr-only">
                    {project.name}. {project.summary} {project.kind}, {project.year}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
