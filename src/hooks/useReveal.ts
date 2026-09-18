'use client';

import { useEffect, useState } from 'react';

/**
 * When a masked block is allowed to come up.
 *
 * Two conditions, and both have to hold: the page must have been handed
 * back by the entry curtain, and the block must have been seen. Keeping
 * them in one place is what stops the index growing two different answers
 * to "has the load finished" — a timeout in one file and an attribute watch
 * in another drift apart the first time `MIN_HOLD_MS` moves.
 *
 * It takes the element rather than owning a ref, so that the effect below
 * can depend on the element arriving. A ref cannot say that, and a reveal
 * that observed `null` once would never fire.
 */

/**
 * The attributes a curtain raises on `<html>` while it is covering the page.
 *
 * There are TWO curtains on this site and a reveal has to wait for either
 * of them — which is the whole reason this is a list rather than a string.
 * `data-preloading` is the entry curtain's, and also drives its own display
 * and the load-time animation pause in `global.css`; `data-routing` is the
 * route curtain's and drives nothing but this. They are deliberately
 * separate: making the route panel raise `data-preloading` would pause
 * every animation on the page and switch on a second scroll lock beside the
 * one `PageTransition` already holds through Lenis.
 */
const CURTAINS = ['data-preloading', 'data-routing'] as const;

/**
 * Whether a curtain has let go of the page.
 *
 * Watching an attribute rather than guessing at a duration is what makes
 * this right on every path: a cold load waits for the preloader, a route
 * change waits for the ink panel to finish uncovering, a reader on `reduce`
 * — where both curtains take a shortcut — is not left looking at a column
 * of empty masks, and nothing here has to be kept in step with a number in
 * another file.
 *
 * The route curtain matters more than it looks. It rises to cover, commits
 * the new route BEHIND itself, and only then uncovers — so a block that
 * asks this question at mount is asking it from behind a closed panel.
 * Measured, before `data-routing` existed: the panel closed at 461ms, the
 * intro's reveal fired at 635ms, and the panel did not clear the top of the
 * screen until 1223ms, by which point the rise was three quarters over. The
 * animation ran perfectly, in a room with the lights off.
 *
 * And the panel uncovers UPWARD, so the top of the page is the last thing
 * it lets go of — which is exactly where the block waiting on `load` sits.
 * That is why the release comes at the end of the reveal rather than at the
 * start of it.
 */
export const useReleased = (): boolean => {
  const [released, setReleased] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    let done = false;

    const settle = (): void => {
      if (done || CURTAINS.some((name) => html.hasAttribute(name))) return;
      done = true;
      setReleased(true);
    };

    const observer = new MutationObserver(settle);
    observer.observe(html, { attributes: true, attributeFilter: [...CURTAINS] });

    // Deferred by a frame, and this is not a nicety. StrictMode invokes
    // effects twice, and the preloader's first cleanup REMOVES the
    // attribute before its second pass re-asserts it (trap 10). A
    // synchronous read at mount can land in that gap and conclude the page
    // was let go before the curtain had even drawn — measured: the intro
    // arrived at 33ms with the curtain still up, and the reveal was over
    // before anyone could see it. Both writes happen in one effect flush,
    // so a frame later the attribute is back and the answer is true. The
    // observer above catches the real release whenever it comes.
    const frame = requestAnimationFrame(settle);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  return released;
};

export type Trigger = 'load' | 'scroll';

/**
 * How far down the screen a block has to reach before it is asked for, as
 * a share of the viewport. Short of the bottom edge, so a block does not
 * begin the moment its first pixel appears and finish before it is
 * anywhere near readable.
 */
const TRIGGER = 0.88;

/** True once the block may be shown. Latches — a reveal happens once. */
export function useReveal(on: Trigger, element: HTMLElement | null): boolean {
  const [seen, setSeen] = useState(on === 'load');
  const released = useReleased();

  useEffect(() => {
    if (on !== 'scroll' || seen || element === null) return;

    let frame = 0;

    const check = (): void => {
      frame = 0;
      // Anything at or above the line counts, not only what is crossing it.
      // An IntersectionObserver reports a *change* of state, and a jump —
      // a hash link, a restored position, a programmatic scroll — can take
      // a block from below the fold to above it without ever intersecting.
      // Measured: at 375 the about paragraph stayed hidden for good after
      // one jump to the foot of the page. Text that never appears is a
      // worse failure than a reveal that fires early.
      if (element.getBoundingClientRect().top >= window.innerHeight * TRIGGER) return;
      setSeen(true);
    };

    const schedule = (): void => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(check);
    };

    check();
    // Lenis scrolls the real document, so a plain scroll listener fires —
    // the same thing `Work` and `ShotStack` rely on rather than taking a
    // dependency on its emitter.
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [on, seen, element]);

  return released && seen;
}
