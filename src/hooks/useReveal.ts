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
 * Whether the entry curtain has let go of the page.
 *
 * The preloader owns `data-preloading` on `<html>` and removes it in
 * `release()`. Watching the attribute rather than guessing at a duration is
 * what makes this right on all three paths: a cold load waits for the
 * curtain, an in-app route change finds no attribute and starts at once,
 * and a reader on `reduce` — where the curtain takes a shortcut — is not
 * left looking at a column of empty masks.
 */
export const useReleased = (): boolean => {
  const [released, setReleased] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    let done = false;

    const settle = (): void => {
      if (done || html.hasAttribute('data-preloading')) return;
      done = true;
      setReleased(true);
    };

    const observer = new MutationObserver(settle);
    observer.observe(html, { attributes: true, attributeFilter: ['data-preloading'] });

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
