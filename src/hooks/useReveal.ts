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
    observer.observe(html, {
      attributes: true,
      attributeFilter: [...CURTAINS]
    });

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

/**
 * Whether this page arrived by a route change rather than a document load.
 *
 * It exists for exactly one thing: the index's masthead. The preloader
 * assembles its own copy of the name and hands it over already in place,
 * exact to the pixel (trap 10), so there is nothing left there to reveal
 * and revealing it anyway would break that handover. A route change has no
 * preloader and no handover — the heading simply appears — so on that path
 * it is free to arrive like everything else, and it is by far the largest
 * thing on the first screen.
 *
 * `data-routing` is the signal because it is a POSITIVE one: it is up, put
 * there by the curtain that is carrying this page in, at the moment the
 * component mounts. Asking "is `data-preloading` absent" instead would
 * answer yes in every gap where neither curtain happens to be up.
 *
 * Read once. How a page got here cannot change while it is here.
 */
/**
 * Whether this document has ever navigated on the client.
 *
 * Module scope, so it is per document — which is exactly the question
 * `useViaRoute` is really asking. The attribute alone is not enough: when
 * the route curtain's 3s cap fires, it lets go BEFORE the destination
 * mounts, and the destination then reads no attribute and concludes it was
 * a cold load. Measured on that path: the attribute went at 3625ms, the
 * page mounted at 4785ms, and the masthead came up carrying no mask at all
 * — the largest thing on the page, never revealed, on the one path where
 * the reader has already been kept waiting.
 */
let routed = false;

/** Called by `PageTransition` the moment a client navigation begins. */
export const markRouted = (): void => {
  routed = true;
};

export const useViaRoute = (): boolean => {
  const [viaRoute, setViaRoute] = useState(false);

  useEffect(() => {
    setViaRoute(routed || document.documentElement.hasAttribute('data-routing'));
  }, []);

  return viaRoute;
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
  // Derived, NOT latched from `on` in a useState initialiser. An initialiser
  // reads its argument exactly once, so an instance that was reused with a
  // different `on` would keep the old answer — and in the one direction that
  // matters, `scroll` to `load`, it keeps `false` while the effect below
  // returns early, which is text that never appears at all. Every other
  // latch here fails open; this is the only one that could fail closed, and
  // it costs nothing to make it a plain derivation.
  const [scrolledTo, setScrolledTo] = useState(false);
  const seen = on === 'load' || scrolledTo;
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
      setScrolledTo(true);
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
