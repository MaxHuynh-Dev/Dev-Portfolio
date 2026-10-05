'use client';

import { useReleased } from '@Hooks/useReveal';
import { fetchJson, LOTTIE_WAVE, loadPlayer } from '@Utils/lottie';
import type { AnimationItem } from 'lottie-web';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

/** The wave, once the box has washed in. It is over by 2.5s. */
const FIRST_MS = 700;

const REDUCE = '(prefers-reduced-motion: reduce)';

/**
 * The owner waving, in `/about`'s picture column: the index's wave, the
 * whole scene.
 *
 * **It plays `wave.json` as it is** — laptop, mug and all, standing on the
 * box's foot by `xMidYMax meet`, the owner's pick over a crop to the head
 * and hand. So the drawing is the index's to the pixel, and both pages
 * share one cached file.
 *
 * **Once on its own, then on request.** The file waves for 1.8s and ends
 * on the pose it starts in — the drawing as drawn, hand up. It used to wait
 * 2.6s and wave again, forever, at the owner's request; a loop that starts
 * by itself and cannot be stopped fails WCAG 2.2.2 (Pause, Stop, Hide), so
 * it now waves once — done by 2.5s, under the criterion's five seconds —
 * and again whenever a pointer comes onto the picture, which is motion the
 * reader asked for.
 *
 * **The photograph is the fallback, not the picture.** When the player or
 * the file cannot be had, `fallback` renders instead — `/about` hands in
 * the CMS portrait there, so the page never shows an empty column. Until
 * then it is not in the document at all, so it is never fetched and never
 * flashes in before the drawing.
 *
 * Under `prefers-reduced-motion` it is the still pose and nothing moves.
 */
export default function Waving({
  label,
  fallback
}: {
  /** The drawing's whole account: the player's SVG is hidden beneath it. */
  label: string;
  fallback: React.ReactNode;
}): React.ReactElement {
  const box = useRef<HTMLSpanElement | null>(null);
  const [failed, setFailed] = useState(false);
  const released = useReleased();

  useEffect(() => {
    if (!released || box.current === null) return;
    const container = box.current;
    let cancelled = false;
    let item: AnimationItem | null = null;
    let timer: number | undefined;
    let unhook = (): void => {};

    void (async () => {
      const [lottie, data] = await Promise.all([
        loadPlayer().catch(() => null),
        fetchJson(LOTTIE_WAVE)
      ]);
      if (cancelled) return;
      if (lottie === null || data === null) {
        setFailed(true);
        return;
      }

      const hello = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: data,
        rendererSettings: { preserveAspectRatio: 'xMidYMax meet', progressiveLoad: false }
      });
      item = hello;
      hello.goToAndStop(0, true);
      if (window.matchMedia(REDUCE).matches) return;

      let playing = false;
      const wave = () => {
        if (playing) return;
        playing = true;
        hello.goToAndPlay(0, true);
      };
      hello.addEventListener('complete', () => {
        playing = false;
      });
      timer = window.setTimeout(wave, FIRST_MS);
      container.addEventListener('pointerenter', wave);
      unhook = () => container.removeEventListener('pointerenter', wave);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unhook();
      item?.destroy();
    };
  }, [released]);

  if (failed) return <>{fallback}</>;

  return (
    <span className="relative block h-full w-full">
      <span ref={box} aria-hidden="true" className="block h-full w-full [&_svg]:block" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
