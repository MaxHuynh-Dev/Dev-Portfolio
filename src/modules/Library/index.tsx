'use client';

import Shot from '@Components/Shot';
import { shortest, useCarousel } from '@Hooks/useCarousel';
import { useReleased, useViaRoute } from '@Hooks/useReveal';
import Link from 'next/link';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Project } from '@/content/site';
import Readout from './Readout';
import Roll, { COVER_SIZES } from './Roll';
import {
  ENTRY_CHROME_AT_MS,
  ENTRY_CHROME_MS,
  ENTRY_CHROME_STAGGER_MS,
  ENTRY_FADE_SHARE,
  ENTRY_LEAD_MS,
  ENTRY_LINE_MS,
  ENTRY_LINE_STAGGER_MS,
  ENTRY_LINES_AT_MS,
  ENTRY_ROLL_PCT,
  ENTRY_TOTAL_MS,
  ENTRY_TURN_MS,
  GATHER_MS,
  HANDOFF_MS,
  READOUT_IN_MS,
  READOUT_OUT_MS,
  readoutBackAt,
  SCROLL_BACK_MS
} from './timing';

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
 *
 * **Below `md`, `fill` replaces the neighbour rules.** The owner asked for
 * the cover in the middle to be as wide as the column on a phone, so there
 * the width is the column's, taken down only by the stage height — and that
 * floored by `COVER_READABLE` exactly as before. Without the floor, a phone
 * held sideways has a ~48px stage, the climb below goes three steps deep,
 * and the cover comes out a 38px stamp; with it that screen gets the same
 * 200px cover it always had. Filling overrules `PEEK` on purpose: at the
 * ring's own pitch the neighbours sit just off both edges at rest and come
 * in as it turns.
 */
const solveCover = (box: DOMRect, fill: number | null): { width: number; fitted: number } => {
  const peek = capFor(box.width, PEEK);
  const whole = capFor(box.width, WHOLE);
  const solve = (steps: number): number =>
    fill === null
      ? Math.min(peek, Math.max(COVER_READABLE, Math.min(whole, box.height / verticalFor(steps))))
      : Math.min(fill, Math.max(COVER_READABLE, box.height / verticalFor(steps)));

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

/** Where a cover has to be for its box to sit exactly on another box. */
interface Landing {
  x: number;
  y: number;
  scale: number;
}

/**
 * The pose that puts a cover `width` wide exactly on `box`, in the
 * surface's own coordinates.
 *
 * `scale()` shrinks about the element's centre, so a cover translated to
 * the box's top and then scaled down sits lower than the box by half of
 * what it gave up: h(1 - scale) / 2. Measured at 34.6px with a 434px cover
 * landing in a 311px slot, which is exactly how far the stack was off. The
 * x needs no such correction: it is centred, and the centre is the thing
 * scaling holds still.
 */
const landing = (box: DOMRect, frame: DOMRect, width: number): Landing => {
  const scale = box.width / width;
  return {
    x: box.left + box.width / 2 - (frame.left + frame.width / 2),
    y: box.top - frame.top - (width * TALL * (1 - scale)) / 2,
    scale
  };
};

/** Ease for the gather — out hard, so it reads as arriving, not drifting. */
const ease = (t: number): number => 1 - (1 - t) ** 3;

/** Smooth 0..1 across a window, for fading one thing inside another. */
const across = (value: number, from: number, to: number): number =>
  Math.min(1, Math.max(0, (value - from) / (to - from)));

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/**
 * The arrival's curve, measured off the reference rather than chosen.
 *
 * Eleven evenly spaced samples of its lines and its chrome both fit
 * `1 - (1 - t) ** 4` to within 0.001 of their span — closer than any other
 * stock curve tried, and closer than the `cubic-bezier(0.25, 1, 0.5, 1)`
 * that approximates it. It is a harder stop than the gather's cubic, which
 * is why the two are kept separate.
 */
const quart = (t: number): number => 1 - (1 - t) ** 4;

/** Progress of one phase of the arrival, given the elapsed milliseconds. */
const phase = (elapsed: number, at: number, span: number): number =>
  quart(across(elapsed, at, at + span));

type Mode = 'wheel' | 'list';

/**
 * The chrome's cascade, as CSS custom properties.
 *
 * These five are the only things on the page with no per-frame owner, so
 * they are the only ones a transition may drive — everything else has a
 * pose written every frame and a transition on it would be a second
 * opinion (traps 15 and 21). The delay is absolute, counted from the
 * moment the curtain let go, because that is what `data-in` flips on.
 *
 * The reference runs this group 250ms after its first readout line, on the
 * same curve, at a slightly slower beat than the lines — which is what
 * makes eleven staggered moves read as one cascade instead of two.
 *
 * At MODULE scope, not inside the component, so step 4's object can be
 * memoised against `viaRoute` alone and handed to a memoised child.
 */
const chromePose = (step: number, viaRoute: boolean): React.CSSProperties =>
  ({
    '--in-delay': `${(viaRoute ? 0 : ENTRY_LEAD_MS) + ENTRY_LINES_AT_MS + ENTRY_CHROME_AT_MS + step * ENTRY_CHROME_STAGGER_MS}ms`,
    '--in-rise': `${ENTRY_CHROME_MS}ms`
  }) as React.CSSProperties;

export default function Library({
  projects,
  workRange
}: {
  projects: Project[];
  workRange: string;
}): React.ReactElement {
  const [mode, setMode] = useState<Mode>('wheel');

  // The elements the engine drives, held as state rather than refs so that
  // an effect which has to re-attach listeners can depend on the arrival of
  // the element itself, which a ref cannot say.
  const [surface, setSurface] = useState<HTMLDivElement | null>(null);
  const [links, setLinks] = useState<HTMLOListElement | null>(null);
  const [readout, setReadout] = useState<HTMLDivElement | null>(null);
  /** The box in the list the covers gather into. Empty, and measured. */
  const [slot, setSlot] = useState<HTMLDivElement | null>(null);
  /** Each row's own thumbnail below `md`, where there is no deck. */
  const thumbs = useRef<(HTMLDivElement | null)[]>([]);
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
  /**
   * Below `md`, 0 while the covers hold the pictures and 1 once the rows'
   * own thumbnails do. Walked by the same loop as `blend`, after it lands.
   */
  const handoff = useRef(0);

  /**
   * 0 on arrival, 1 once the page has introduced itself.
   *
   * The same shape as `blend`, and for the same reason: it is folded into
   * `draw`, so a cover still has exactly one piece of code deciding where it
   * goes. Nothing here tweens a transform — a GSAP tween or a CSS transition
   * on these elements would be a second opinion about a pose that is already
   * written every frame from a position (traps 15 and 21).
   *
   * It starts at 0 and is folded from the very first paint, so the covers
   * are parked by construction on every path rather than by timing.
   */
  const entry = useRef(0);
  /** Set once the arrival is over, so `draw` can skip all of it. */
  const arrived = useRef(false);

  /**
   * The last rAF timestamp a paint was made on.
   *
   * Three loops can ask for a paint in one frame — the carousel's own, the
   * gather's and the entry's — and callbacks scheduled for the same frame
   * all receive the SAME timestamp, so this collapses them to one. Without
   * it, a gather starting while the ring is still easing already draws twice
   * per frame: 96 readout writes with two `getBoundingClientRect` reads
   * interleaved between them, against the 32-writes-per-frame budget trap 21
   * was measured at.
   */
  const painted = useRef(0);

  /** True once neither curtain is in the way. Watches both attributes. */
  const released = useReleased();
  /**
   * Which curtain brought the reader here, which is what the lead is for.
   *
   * The preloader lets go MID-dissolve, with about 340ms of paper still
   * fading, so an arrival starting at zero spends its first phase behind a
   * translucent sheet. The route panel lets go at the END of its uncover
   * and hands over a clear screen — so the same lead there is just the ring
   * sitting still after the panel has already gone, which is the mistake
   * trap 28 fixed, pointing the other way.
   */
  const viaRoute = useViaRoute();
  /** The same answer, for `draw`, which is a stable callback. */
  const viaRouteRef = useRef(false);
  useEffect(() => {
    viaRouteRef.current = viaRoute;
  }, [viaRoute]);

  const chrome = (step: number): React.CSSProperties => chromePose(step, viaRoute);

  /**
   * Step 4 lives inside `Readout`, so it has to be handed over rather than
   * written at its own call site — and it is memoised because `Readout` is
   * `memo`'d on purpose. A fresh object every render would defeat that and
   * re-render the readout on every mode switch, which is the one thing
   * trap 21 bought by keeping it out of React's way.
   */
  const counterPose = useMemo(() => chromePose(4, viaRoute), [viaRoute]);

  const draw = useCallback(
    (position: number): void => {
      // The readout rolls WITH the ring, not after it. Every line is placed
      // from the same continuous position the covers are, so half a turn of
      // the wheel leaves the name half out of its mask — where parking each
      // line on the nearest whole project and transitioning between the two
      // poses could only ever start moving once the ring had already
      // arrived. One number drives both, and there is no timeline to fall
      // behind.
      // The arrival is folded into the SAME string, not layered on top of
      // it. `.st-roll` is the clip and `draw` only ever writes its children,
      // so translating the mask would move the window with the text and
      // reveal nothing — the offset has to be on the line, in the same
      // percentage the ring's own position is expressed in.
      // The beat is per MASK and not per project: what cascades is the
      // number, then the name, then the line, then the year — four things
      // one after another, which is what the reference's five-line readout
      // does. Staggering by project would be eight lines racing inside one
      // mask where only one of them is ever on screen.
      const elapsed = arrived.current ? Number.POSITIVE_INFINITY : entry.current;
      for (let mask = 0; mask < rolls.current.length; mask += 1) {
        const roll = rolls.current[mask];
        const up =
          (1 - phase(elapsed, ENTRY_LINES_AT_MS + mask * ENTRY_LINE_STAGGER_MS, ENTRY_LINE_MS)) *
          ENTRY_ROLL_PCT;
        for (let index = 0; index < roll.length; index += 1) {
          const away = shortest(index - position, roll.length);
          // The stack SPREADS as it is pushed down, and that is not a
          // flourish. A line is in the window while its offset is within
          // ±100% of the mask, and at rest they sit 110% apart — so pushing
          // every line down by 100% lands the line BEFORE this one at -10%,
          // dead centre. Measured: during the arrival the readout showed
          // "08 Project Eight 2022" instead of the project the ring was on.
          // There is no uniform push that hides all of them at 110% spacing;
          // widening the gap as they go is what empties the window.
          roll[index].style.transform = `translateY(${(away * (110 + up) + up).toFixed(2)}%)`;
        }
      }

      // The ring turns one whole revolution into place, which is the
      // reference's signature and the reason its covers need no fade: they
      // are never absent, they are arriving. Folded in as an OFFSET to the
      // position the covers are read from, so `useCarousel` still owns the
      // real position and `draw` still owns every pose — rather than a tween
      // driving the carousel, which would be two authors for one number.
      //
      // The readout above is deliberately NOT turned with it. On the
      // reference the wheel spins and the type rises separately; giving the
      // readout this offset would spin eight names behind a one-line mask
      // for no gain.
      const spun = position + (1 - phase(elapsed, 0, ENTRY_TURN_MS)) * projects.length;

      if (pitch.current === 0) {
        // Before `measure()` has run there is no pose to write, and the
        // covers would otherwise paint stacked on top of each other at full
        // opacity. Both curtains hide that frame; a Back or Forward
        // navigation raises neither and it is visible. `draw` stays the only
        // thing that touches them.
        for (const element of covers.current) {
          if (element !== null && element !== undefined) element.style.opacity = '0';
        }
        return;
      }
      const radius = pitch.current / Math.sin(STEP_DEG * RAD);
      const fade = fadeFor(projects.length);

      // Where the covers land, measured off the list rather than positioned
      // by a second set of numbers that would have to be kept in step with
      // the list's own layout. Read once per frame, not once per cover, and
      // only while there is a gather to draw.
      //
      // Two answers, and which one is live is read off the layout rather than
      // restated as a breakpoint here: below `md` every row has a thumbnail
      // with a box and there is no deck, above it the thumbnails have no box
      // and the deck does. A second copy of `md` in this file would be a
      // number kept in step by hand with a class in `Roll`.
      const gather = ease(blend.current);
      let stack = null as Landing | null;
      let rows = null as Landing[] | null;
      if (gather > 0 && surface !== null && cover.current > 0) {
        const frame = surface.getBoundingClientRect();
        const boxes = thumbs.current.map((thumb) => thumb?.getBoundingClientRect() ?? null);
        if (
          boxes.length === projects.length &&
          boxes.every((box) => box !== null && box.width > 0)
        ) {
          rows = (boxes as DOMRect[]).map((box) => landing(box, frame, cover.current));
        } else if (slot !== null) {
          stack = landing(slot.getBoundingClientRect(), frame, cover.current);
        }
      }

      // Every cover is on its own row's thumbnail, so the thumbnail takes
      // over and the cover dissolves off the top of it (see `HANDOFF_MS`).
      // The picture a finger scrolls has to be IN the scroll region — native
      // scrolling runs off the main thread, and a cover moved to follow it
      // from here is always a frame behind it. So the covers only exist for
      // the flight, and the rows own the pictures either side of it (trap
      // 49).
      const landed = rows !== null && gather === 1;
      for (const thumb of thumbs.current) {
        if (thumb !== null && thumb !== undefined) thumb.style.opacity = landed ? '1' : '0';
      }
      const centre = Math.round(position);

      for (let index = 0; index < projects.length; index += 1) {
        const element = covers.current[index];
        if (element === null || element === undefined) continue;

        const away = shortest(index - spun, projects.length);
        const angle = away * STEP_DEG;
        let x = radius * Math.sin(angle * RAD);
        let y = ringTop.current + radius * (1 - Math.cos(angle * RAD));
        let turn = angle;
        let scale = Math.max(0.2, 1 - Math.abs(away) * SHRINK);
        let shown = Math.min(1, Math.max(0, (fade - Math.abs(away)) / FADE_OVER));

        const row = rows?.[index];
        if (row !== undefined) {
          // Each cover to its own row, upright and whole. There is no deck to
          // lean in and nothing to hide underneath, so every one of them is
          // seen arriving, the ones that had faded round the back included.
          x = mix(x, row.x, gather);
          y = mix(y, row.y, gather);
          turn = mix(turn, 0, gather);
          scale = mix(scale, row.scale, gather);
          shown = mix(shown, 1, gather);
        } else if (stack !== null) {
          // Depth in the deck is taken from the settled project, not the
          // continuous position: a stack whose cards re-order mid-flight
          // shuffles instead of gathering.
          const depth = shortest(index - centre, projects.length);
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

        // Hit-testing is decided by the RING's opacity, before the arrival
        // is folded in. Deriving it from the faded value instead would make
        // every cover pointer-transparent for the first part of the entry
        // and flicker across the 0.05 boundary — and it would put a second
        // author on hit-testing beside the drag suppression in useCarousel,
        // whose "restored two frames after pointerup" reasoning assumes it
        // is the only one.
        const solid = shown < 0.05 ? 'none' : '';

        // A whole revolution is a no-op modulo the count: `shortest(i - 8, 8)`
        // and `shortest(i, 8)` are the same number, so the ring's first frame
        // and its last are the SAME pose. That left the covers sitting at
        // their finished position for the entire uncover and then jumping
        // away to spin back — measured as the page looking done and then
        // animating anyway, 106ms after the panel had gone.
        //
        // The reference can turn without fading because it has no curtain at
        // all; its ring is already moving at load + 15ms, long before anyone
        // is looking. Ours arrives from behind a panel, so the covers have to
        // be absent until they are arriving. This fades them in across the
        // first part of the turn — multiplied by `(1 - gather)` so it cannot
        // touch a cover that is on its way to the slot.
        //
        // NOT on the route path any more. The arrival starts as the panel
        // starts to leave (see `useReleased`), so the covers are already
        // turning when they are first uncovered — never sitting still in
        // their finished pose — and fading pictures that are already
        // decoded only made them look late.
        const arriving = viaRouteRef.current
          ? 1
          : mix(phase(elapsed, 0, ENTRY_TURN_MS * ENTRY_FADE_SHARE), 1, gather);

        element.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px), ${y.toFixed(
          2
        )}px, 0) rotate(${turn.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        element.style.opacity = (shown * arriving * (landed ? 1 - handoff.current : 1)).toFixed(3);
        // A cover nobody can see must not take a click either. It stays
        // focusable, though: tabbing onto it is what brings it round.
        element.style.pointerEvents = solid;
        element.style.zIndex = String(
          stack === null && rows === null
            ? 50 - Math.round(Math.abs(away) * 10)
            : 50 - Math.abs(shortest(index - centre, projects.length))
        );
      }
    },
    [projects, slot, surface]
  );

  const carousel = useCarousel({
    count: projects.length,
    onFrame: draw,
    enabled: mode === 'wheel',
    surface,
    links
  });

  const { redraw } = carousel;

  /**
   * Paint at most once per frame, however many loops asked.
   *
   * rAF callbacks scheduled for the same frame all receive the same
   * timestamp, so this is exact rather than approximate.
   */
  const paintOnce = useCallback(
    (now: number): void => {
      if (painted.current === now) return;
      painted.current = now;
      redraw();
    },
    [redraw]
  );

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

    // Whether the cover fills the column is the stylesheet's call, made at
    // the same breakpoint as everything else below `md` and read off the
    // surface — not a second copy of that breakpoint in this file. The
    // column is the stage the surface bleeds out of.
    const fills = getComputedStyle(surface).getPropertyValue('--cover-fill').trim() === '1';
    const column = surface.parentElement?.getBoundingClientRect().width ?? 0;
    const { width, fitted } = solveCover(box, fills && column > 0 ? column : null);
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
  /**
   * The arrival, and the only non-user-triggered motion on this page.
   *
   * Gated on `useReleased`, which watches BOTH curtains' attributes, so a
   * cold load waits for the preloader and a route change waits for the ink
   * panel. Deliberately not a second answer to "has the load finished" — a
   * timeout here and an attribute watch there drift the first time
   * `MIN_HOLD_MS` moves.
   *
   * Also gated on `pitch`, because before `measure()` has run there is no
   * pose to arrive at; `surface` is state, so the first measurement lands
   * after the first paint.
   */
  useEffect(() => {
    if (!released || arrived.current) return;

    // One-shot, like the gather's. Only `useCarousel` keeps a live listener,
    // and it does so because it outlives every gesture.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      arrived.current = true;
      redraw();
      return;
    }

    // Started on the first frame that HAS a pose, not on the first frame
    // after the release. `surface` is state, so `measure()` lands after the
    // first paint, and a clock started before it would spend its lead — or
    // all of it — on covers `draw` is still refusing to place. Waiting here
    // rather than bailing out is also what keeps this fail-open: an arrival
    // that never starts is a ring that never turns up.
    let start = 0;
    let frame = requestAnimationFrame(function step(now: number): void {
      if (pitch.current === 0) {
        frame = requestAnimationFrame(step);
        return;
      }
      if (start === 0) start = now + (viaRoute ? 0 : ENTRY_LEAD_MS);
      entry.current = Math.max(0, now - start);
      if (entry.current >= ENTRY_TOTAL_MS) arrived.current = true;
      paintOnce(now);
      if (!arrived.current) frame = requestAnimationFrame(step);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [released, viaRoute, redraw, paintOnce]);

  useEffect(() => {
    const target = mode === 'list' ? 1 : 0;
    blendTo.current = target;

    // The reader has acted, so the arrival is superseded. Snapping it rather
    // than letting both scalars be mid-flight is what keeps the gather's
    // landing exact: a cover that arrives on the slot plus an entry offset
    // is not on the slot.
    if (target === 1) arrived.current = true;

    // Leaving for the ring, the covers take the pictures back at once. They
    // are about to move, and a picture in motion does not show its raster.
    if (target === 0) handoff.current = 0;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      blend.current = target;
      handoff.current = target;
      redraw();
      return;
    }

    const from = blend.current;
    const distance = Math.abs(target - from);
    if (distance < 0.001) {
      // Already there, so there is no flight to hand over at the end of.
      // Finishing the handover outright is what keeps a re-run of this
      // effect from leaving a cover half-dissolved over its row for good.
      handoff.current = target;
      redraw();
      return;
    }

    const ms = GATHER_MS * distance;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now: number): void {
      const t = Math.min(1, (now - start) / ms);
      blend.current = from + (target - from) * t;
      // Only once the flight is over, so the dissolve happens with neither
      // picture moving. Only `draw` decides whether there is anything to
      // hand over to; above `md` there is not, and this walks for nothing.
      if (target === 1) handoff.current = across(now - start - ms, 0, HANDOFF_MS);
      paintOnce(now);
      if (t < 1 || (target === 1 && handoff.current < 1)) frame = requestAnimationFrame(step);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [mode, redraw, paintOnce]);

  const shown = mode === 'list';

  /**
   * True while the page may be longer than the screen: below `md` the list
   * runs on down the page and the document scrolls, where above it the list
   * is a region inside one screen. The owner asked for every project to be
   * shown rather than held to the screen's height.
   *
   * It comes on with the list and goes a beat AFTER it. The ring is one
   * screen tall, so going back to it takes the reader up to the top while
   * the rows fall, and only then lets the page be one screen again —
   * shortening it under a reader who is still scrolled down would clamp the
   * scroll in one jump, which is the thing the route curtain exists to hide.
   */
  const [long, setLong] = useState(false);
  useEffect(() => {
    if (mode === 'list') {
      setLong(true);
      return;
    }
    if (window.scrollY > 0) {
      if (window.lenis === undefined) window.scrollTo(0, 0);
      else window.lenis.scrollTo(0, { duration: SCROLL_BACK_MS / 1000 });
    }
    const timer = window.setTimeout(
      () => {
        setLong(false);
      },
      Math.max(SCROLL_BACK_MS, readoutBackAt(projects.length))
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [mode, projects.length]);

  /**
   * Below `md`, the readout's way out and back. Out before the first row
   * rises into its room, and back only once the last row has fallen out of
   * it. Above `md` it never changes, so this never runs there.
   */
  const readoutFade: React.CSSProperties = {
    transitionProperty: 'opacity',
    transitionDuration: `${shown ? READOUT_OUT_MS : READOUT_IN_MS}ms`,
    transitionDelay: `${shown ? 0 : readoutBackAt(projects.length)}ms`
  };

  return (
    <section
      aria-labelledby="library-heading"
      className="relative flex h-[100dvh] flex-col px-[var(--gut)] pt-[var(--chrome-top)] pb-[calc(var(--chrome-top)+0.5rem)]"
    >
      <header className="flex items-baseline justify-between gap-6">
        <h1 id="library-heading" className="st-meta m-0 font-[500] text-[var(--ink)]">
          <span className="st-line" data-in={released} style={chrome(0)}>
            <span className="st-line-body">work</span>
          </span>
        </h1>
        <p className="st-meta tabular-nums">
          <span className="st-line" data-in={released} style={chrome(1)}>
            <span className="st-line-body">{workRange}</span>
          </span>
        </p>
      </header>

      <div className="mt-[0.3rem] flex items-baseline justify-between gap-6">
        {/* Two buttons rather than a tab strip: they change how the same
            list is drawn, not which list is shown, and aria-pressed is the
            thing that says which one is on. Never appearance alone. */}
        {/* The mask is the <p> and the flex row is the LINE inside it. The
            other way round, Tailwind's `flex` would beat `.st-line`'s own
            `display: block` — utilities are layered after components — and
            the buttons would sit in a clip that never moves. */}
        <p className="st-meta st-line" data-in={released} style={chrome(2)}>
          <span className="st-line-body flex items-baseline">
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
          </span>
        </p>

        {shown ? null : (
          <p className="st-meta st-line" data-in={released} style={chrome(3)}>
            <span className="st-line-body">drag or scroll</span>
          </p>
        )}
      </div>

      {/* The readout and one stage for both views, in one grid and behind one
          clip. The views are overlaid rather than laid out one after the
          other so that switching reflows nothing: the ring keeps the box it
          solved against, and the covers can fly to a slot that has not moved
          under them.

          Below `md` the list also lies over the READOUT's row, and the
          readout goes while the list is up — every row there carries its
          own picture, name and year, so a readout of one of them only says it
          again — and the list has the room. It is an overlay for the same
          reason as the rest: collapsing the readout would grow the stage,
          and the ring would re-solve and jump under covers that are leaving
          it. That is also why the clip is HERE, full-bleed round both rows,
          and not on the covers' own layer: a cover flying to the first row
          has to be seen above the stage.

          Gone means out of the hit test too, not only out of sight. The
          readout's lines carry transforms, so they paint — and take hits —
          above the list's rows, which are not positioned: at opacity 0 alone
          it swallowed every tap on the first row.

          And below `md` the list is not held to the screen at all: while it
          is up the clip comes off here and on the list, the rows run on down
          past the stage, and the DOCUMENT scrolls — see `long`. The stage
          keeps its box, so the ring is never asked to re-solve. */}
      <div
        className={
          long
            ? 'mx-[calc(var(--gut)*-1)] mt-[clamp(1.2rem,4vh,2.8rem)] grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-clip px-[var(--gut)] max-md:overflow-visible'
            : 'mx-[calc(var(--gut)*-1)] mt-[clamp(1.2rem,4vh,2.8rem)] grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] overflow-clip px-[var(--gut)]'
        }
      >
        <div
          ref={setReadout}
          style={readoutFade}
          className={
            shown
              ? 'col-[1] row-[1] max-md:pointer-events-none max-md:opacity-0'
              : 'col-[1] row-[1]'
          }
        >
          <Readout projects={projects} released={released} counterPose={counterPose} />
        </div>

        <div
          aria-hidden={!shown}
          inert={!shown}
          data-lenis-prevent=""
          onScroll={redraw}
          className={[
            'relative col-[1] row-[1/3] min-h-0 md:row-[2/3] md:mt-[clamp(0.8rem,3vh,2rem)]',
            shown ? 'st-quiet-scroll overflow-y-auto' : 'pointer-events-none overflow-clip',
            long ? 'max-md:overflow-visible' : ''
          ].join(' ')}
        >
          {/* `relative` is not decoration. Each row's `sr-only` line is
              absolutely positioned, and an absolute box escapes every clip
              between it and its containing block — without this the section
              was that block, and the parked rows' lines lengthened a
              one-screen page by 140px on a phone held sideways.

              The foot padding is the section's own, because overflowing
              content does not get the section's: it lets the last row come
              to rest exactly where the list's box ends — clear of the bottom
              corner marks — and only makes the page scroll when a row
              actually runs past that line. */}
          <div className="flex flex-col gap-[clamp(0.6rem,2vh,2rem)] max-md:pb-[calc(var(--chrome-top)+0.5rem)] md:flex-row md:items-start md:gap-[clamp(1.5rem,4vw,3.5rem)]">
            <div className="order-2 min-w-0 flex-1 md:order-1">
              <Roll
                projects={projects}
                active={carousel.active}
                shown={shown}
                onActive={carousel.goTo}
                thumbs={thumbs}
              />
            </div>

            {/* Where the covers gather, and nothing else. Empty, because
                the cover layer below draws the real thing into it, and
                hidden, because it is a picture of the row the list has
                already named. Its box is measured every frame of the
                gather, so the list owns where the stack ends up and this
                file never has a second opinion about it.

                Not below `md`, where every row carries its own picture and
                a preview of one of them would only repeat it (see Roll). */}
            <div
              ref={setSlot}
              aria-hidden="true"
              style={{ aspectRatio: '16 / 9' }}
              className="order-1 w-[clamp(8rem,36vw,20rem)] shrink-0 self-center max-md:hidden md:order-2 md:self-start"
            />
          </div>
        </div>

        {/* The stage the ring is solved against — the row under the readout,
            at every width, whatever the list is doing.

            It lies over the list's rows and comes after them, so it must
            take no hits of its own: without `pointer-events-none` every row
            under it was unclickable. Only the covers' layer takes them back,
            and only while the ring is the view. */}
        <div className="pointer-events-none relative col-[1] row-[2/3] mt-[clamp(0.8rem,3vh,2rem)]">
          {/* The covers, last so they paint over the slot, and full-bleed so
            the ring can run off the sides of the screen. The grid round
            both rows is what clips them, so the ones that have dropped below
            the ring cannot lengthen the page — `clip`, never `hidden`, see
            the note in global.css. */}
          <div
            ref={setSurface}
            aria-hidden={shown}
            inert={shown}
            className={
              shown
                ? 'pointer-events-none absolute inset-y-0 right-[calc(var(--gut)*-1)] left-[calc(var(--gut)*-1)] max-md:[--cover-fill:1]'
                : 'pointer-events-auto absolute inset-y-0 right-[calc(var(--gut)*-1)] left-[calc(var(--gut)*-1)] cursor-[var(--cursor-grab)] touch-none max-md:[--cover-fill:1]'
            }
          >
            {/* `data-await-images`: the ring turns through a whole revolution
              as it arrives (trap 35), so every cover crosses the screen in
              the first second, not just the ones in view at rest. The route
              curtain waits for everything in here to be loaded and decoded
              before it opens — and `eager` is what makes sure the ones off
              to the side have been asked for at all (trap 47). */}
            <ol ref={setLinks} data-await-images="" className="m-0 list-none p-0">
              {projects.map((project, index) => (
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
                      sizes={COVER_SIZES}
                      eager
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
      </div>
    </section>
  );
}
