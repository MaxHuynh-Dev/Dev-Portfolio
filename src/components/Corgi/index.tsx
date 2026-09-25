'use client';

import { useReleased } from '@Hooks/useReveal';
import { type LottieHandle, LottieSvg } from 'lottie-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import corgi from './corgi.json';

/** How many 2s cycles one visit is worth. Under 5s, for WCAG 2.2.2. */
const VISIT_WAGS = 2;
/** And one for a hover, which is the reader asking. */
const HOVER_WAGS = 1;

/**
 * The corgi in the middle of the bottom chrome, wagging for whoever came in.
 *
 * It does not wag all the time. Motion on this site answers an action or
 * marks an arrival (see the a11y invariants), and a tail going forever at
 * the foot of every page would be neither — it would also be motion lasting
 * past five seconds with no way to stop it. So a VISIT is what it answers:
 * the page being handed over by the preloader, and every route change after
 * that, as the panel starts to leave. Two cycles, about 4s, then it stands
 * still. Hovering it asks for one more.
 *
 * Under `reduce` it never plays; it stands in its resting pose, which is
 * frame 0. `useReleased` is what says the entry curtain has let go, so the
 * first wag is not spent behind the paper.
 *
 * The file is drawn by `scripts/corgi-lottie.mjs`, in two tones that
 * global.css replaces with `--ink` and `--paper` — which is what lets it sit
 * inside `.st-blend` and land as ink on paper like the words beside it.
 */
export default function Corgi(): React.ReactElement {
  const handle = useRef<LottieHandle>(null);
  const left = useRef(0);
  const [ready, setReady] = useState(false);
  const released = useReleased();

  const wag = useCallback((times: number): void => {
    const lottie = handle.current;
    if (lottie === null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Already wagging: a hover during a visit does not restart it.
    if (left.current > 0) return;
    left.current = times;
    lottie.seek(0);
    lottie.play();
  }, []);

  const onComplete = useCallback((): void => {
    const lottie = handle.current;
    if (lottie === null) return;
    left.current -= 1;
    if (left.current > 0) {
      lottie.seek(0);
      lottie.play();
      return;
    }
    left.current = 0;
    // `stop` returns to frame 0, which is the resting pose by construction.
    lottie.stop();
  }, []);

  // The first visit: the document load, once the preloader has let go.
  useEffect(() => {
    if (ready && released) wag(VISIT_WAGS);
  }, [ready, released, wag]);

  // Every visit after it: a route change, as the panel starts to leave.
  // This component lives in the layout and is never remounted by a route
  // change, so it watches the curtain's own attribute for the moment.
  useEffect(() => {
    if (!ready) return;
    const html = document.documentElement;
    const observer = new MutationObserver(() => {
      if (html.getAttribute('data-routing') === 'leaving') wag(VISIT_WAGS);
    });
    observer.observe(html, { attributes: true, attributeFilter: ['data-routing'] });
    return () => {
      observer.disconnect();
    };
  }, [ready, wag]);

  const subscriptions = useMemo(
    () => ({ ready: () => setReady(true), complete: onComplete }),
    [onComplete]
  );

  return (
    <LottieSvg
      aria-hidden="true"
      className="st-corgi"
      src={corgi}
      autoplay={false}
      loop={false}
      lottieRef={handle}
      subscriptions={subscriptions}
      onPointerEnter={() => wag(HOVER_WAGS)}
    />
  );
}
