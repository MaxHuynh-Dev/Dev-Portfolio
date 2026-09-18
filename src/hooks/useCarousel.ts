'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * The ring's position engine.
 *
 * One number — where the ring stands, in project units — driven by the
 * wheel, a drag or the arrow keys, eased toward a target and settled on a
 * whole project when the input stops. It wraps, so the last project leads
 * back to the first rather than hitting a wall.
 *
 * The position is a ref and NOT React state. It moves every frame, and
 * eight transforms per frame is cheap while eight React renders per frame
 * is not. `onFrame` is where the caller writes those transforms. The only
 * thing that does reach React is `active`, which changes when a project
 * crosses the middle — a handful of times per gesture, not sixty.
 */

/** Pixels of wheel or drag travel that advance the ring by one project. */
const PITCH_PX = 210;

/**
 * Fraction of the remaining gap closed per 60Hz frame.
 *
 * Re-derived against the real frame delta below, because a fixed fraction
 * per frame eases twice as fast on a 120Hz display as on a 60Hz one — the
 * same gesture would feel different on two machines.
 */
const CLOSE_PER_FRAME = 0.14;

/** Input quiet for this long and the ring settles on a whole project. */
const SETTLE_MS = 110;

/** Below this the loop stops rather than chasing a rounding error forever. */
const EPSILON = 0.0004;

/** Pointer travel that turns a click into a drag. */
const DRAG_SLOP = 6;

/** A wheel notch in line mode is a line, not a pixel. Firefox sends these. */
const LINE_PX = 16;

/** Under `reduce`, the shortest gap between two accepted wheel gestures. */
const QUIET_MS = 320;

/** `value` folded into `[0, span)`. */
export const wrap = (value: number, span: number): number => ((value % span) + span) % span;

/** The signed shorter way round from 0 to `value`, in `(-span/2, span/2]`. */
export const shortest = (value: number, span: number): number => {
  const folded = wrap(value, span);
  return folded > span / 2 ? folded - span : folded;
};

export interface CarouselOptions {
  count: number;
  /**
   * Runs on every frame the ring moves, and once whenever `redraw` is
   * called. Write transforms from here.
   */
  onFrame: (position: number) => void;
  /**
   * False while the ring is not on screen — the list view is the same set
   * of projects in a different shape, and it must not be dragged.
   */
  enabled: boolean;
  /**
   * The element that takes the wheel, the drag and the arrow keys.
   *
   * The element itself and not a ref, so it is an honest dependency of the
   * effect below: the ring is unmounted in the list view, and what has to
   * re-attach the listeners is a new element arriving, which a ref cannot
   * say and a state can.
   */
  surface: HTMLElement | null;
  /**
   * The element holding the links a drag must not fire. Its own element,
   * because the suppression works by taking the anchors out of the hit
   * test and the surface itself has to stay in it.
   */
  links: HTMLElement | null;
}

export interface Carousel {
  /** The project nearest the middle. Changes as one crosses it. */
  active: number;
  /** Bring a project to the middle, by the shorter way round. */
  goTo: (index: number) => void;
  /** Draw the current position again — after a mount, or a resize. */
  redraw: () => void;
}

export function useCarousel({
  count,
  onFrame,
  enabled,
  surface,
  links
}: CarouselOptions): Carousel {
  // onFrame is a fresh closure every render; the effect must not tear the
  // whole engine down and rebuild it for that.
  const frame = useRef(onFrame);
  frame.current = onFrame;

  const [active, setActive] = useState(0);

  const position = useRef(0);
  const target = useRef(0);
  const raf = useRef(0);
  const previous = useRef(-1);
  const settle = useRef(0);
  const reduce = useRef(false);

  // The effect owns the engine and hands these two back out, because the
  // callbacks it builds close over everything above.
  const jump = useRef<(index: number) => void>(() => undefined);
  const paint = useRef<() => void>(() => undefined);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduce.current = media.matches;
    const onQuery = (): void => {
      reduce.current = media.matches;
    };
    media.addEventListener('change', onQuery);

    const draw = (): void => {
      frame.current(position.current);
      const next = wrap(Math.round(position.current), count);
      // The updater form so an unchanged answer costs nothing: React bails
      // out of the render when the state is identical, which it is on most
      // of the frames of a gesture.
      setActive((current) => (current === next ? current : next));
    };

    const tick = (now: number): void => {
      raf.current = 0;
      const delta = previous.current < 0 ? 16.667 : Math.min(now - previous.current, 64);
      previous.current = now;

      const gap = target.current - position.current;
      if (Math.abs(gap) < EPSILON) {
        position.current = target.current;
        previous.current = -1;
        draw();
        return;
      }

      position.current += gap * (1 - (1 - CLOSE_PER_FRAME) ** (delta / 16.667));
      draw();
      raf.current = requestAnimationFrame(tick);
    };

    const run = (): void => {
      // Under `reduce` the ring does not travel. Every gesture is already
      // quantised to whole projects below, so this lands on one.
      if (reduce.current) {
        position.current = target.current;
        draw();
        return;
      }
      if (raf.current !== 0) return;
      previous.current = -1;
      raf.current = requestAnimationFrame(tick);
    };

    const arm = (): void => {
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => {
        target.current = Math.round(target.current);
        run();
      }, SETTLE_MS);
    };

    const push = (delta: number): void => {
      target.current += delta;
      run();
      arm();
    };

    // Adding the signed shorter way round to the current target always
    // lands on the integer `index`, however far round the ring the target
    // has already wound.
    jump.current = (index: number): void => {
      window.clearTimeout(settle.current);
      target.current += shortest(index - target.current, count);
      run();
    };
    paint.current = draw;

    if (!enabled || surface === null) {
      draw();
      return () => {
        media.removeEventListener('change', onQuery);
        if (raf.current !== 0) cancelAnimationFrame(raf.current);
        raf.current = 0;
        window.clearTimeout(settle.current);
      };
    }

    let quiet = 0;

    const onWheel = (event: WheelEvent): void => {
      // A trackpad swiped sideways is the same gesture as one swiped down.
      const raw = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (raw === 0) return;
      event.preventDefault();

      if (reduce.current) {
        // A trackpad sends dozens of events per flick. One project per
        // gesture, not per event.
        const now = performance.now();
        if (now < quiet) return;
        quiet = now + QUIET_MS;
        target.current = Math.round(target.current) + Math.sign(raw);
        run();
        return;
      }

      // deltaMode is lines on Firefox and pages on some setups. Neither is
      // a pixel, and treating them as one makes a notch move the ring by a
      // hundredth of a project.
      const scale =
        event.deltaMode === 1 ? LINE_PX : event.deltaMode === 2 ? window.innerHeight : 1;
      push((raw * scale) / PITCH_PX);
    };

    let pointer = -1;
    let origin = 0;
    let anchor = 0;
    let dragged = false;

    const release = (): void => {
      if (links !== null) links.style.pointerEvents = '';
    };

    const onDown = (event: PointerEvent): void => {
      if (event.button !== 0 || pointer !== -1) return;
      pointer = event.pointerId;
      origin = event.clientX;
      anchor = target.current;
      dragged = false;
      window.clearTimeout(settle.current);
    };

    const onMove = (event: PointerEvent): void => {
      if (event.pointerId !== pointer) return;
      const travel = event.clientX - origin;
      if (!dragged && Math.abs(travel) < DRAG_SLOP) return;

      if (!dragged) {
        dragged = true;
        surface.style.cursor = 'grabbing';
        // From here the click that ends this gesture must not navigate.
        // PageTransition listens on `document` in the CAPTURE phase, so it
        // sees the click before any listener this hook could add — there is
        // no cancelling it after the fact. Taking the anchors out of the hit
        // test is what keeps the click off them in the first place, and it
        // keeps next/link out of it too.
        if (links !== null) links.style.pointerEvents = 'none';
      }

      if (reduce.current) {
        target.current = Math.round(anchor) - Math.round(travel / PITCH_PX);
      } else {
        target.current = anchor - travel / PITCH_PX;
      }
      run();
    };

    const onUp = (event: PointerEvent): void => {
      if (event.pointerId !== pointer) return;
      pointer = -1;
      surface.style.cursor = '';
      if (!dragged) return;
      arm();
      // The click is dispatched right after pointerup and before the next
      // frame, so restoring one frame later is what makes the suppression
      // cover that click and nothing after it.
      requestAnimationFrame(() => {
        requestAnimationFrame(release);
      });
    };

    const onKey = (event: KeyboardEvent): void => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === 'ArrowRight') {
        target.current = Math.round(target.current) + 1;
      } else if (event.key === 'ArrowLeft') {
        target.current = Math.round(target.current) - 1;
      } else if (event.key === 'Home') {
        jump.current(0);
        event.preventDefault();
        return;
      } else if (event.key === 'End') {
        jump.current(count - 1);
        event.preventDefault();
        return;
      } else {
        return;
      }
      event.preventDefault();
      window.clearTimeout(settle.current);
      run();
    };

    surface.addEventListener('wheel', onWheel, { passive: false });
    surface.addEventListener('pointerdown', onDown);
    surface.addEventListener('keydown', onKey);
    // On the window, so a drag survives the pointer leaving the ring — and
    // so it keeps running while the anchors inside are out of the hit test.
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);

    draw();

    return () => {
      media.removeEventListener('change', onQuery);
      surface.removeEventListener('wheel', onWheel);
      surface.removeEventListener('pointerdown', onDown);
      surface.removeEventListener('keydown', onKey);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (raf.current !== 0) cancelAnimationFrame(raf.current);
      raf.current = 0;
      window.clearTimeout(settle.current);
      // An unmount mid-drag must not leave the links unclickable.
      release();
    };
  }, [count, enabled, surface, links]);

  const goTo = useCallback((index: number): void => {
    jump.current(index);
  }, []);

  const redraw = useCallback((): void => {
    paint.current();
  }, []);

  return { active, goTo, redraw };
}
