'use client';

import { type LottieHandle, LottieSvg } from 'lottie-react';
import Link from 'next/link';
import type React from 'react';
import { useCallback, useMemo, useRef } from 'react';

import mark from './mark.json';

/**
 * The M in the middle of the header — a logo, so a link home.
 *
 * It moves only when asked: pointer over it, or keyboard focus on it. One
 * play, 1.2s — the stroke wipes out and draws itself back in, left to right
 * — and a play already running is not restarted, so sweeping the pointer
 * across it does not stutter. Under `reduce` it never plays.
 *
 * The file is drawn by `scripts/mark-lottie.mjs` in one placeholder tone
 * that global.css replaces with `--ink`, so it lands as ink on paper inside
 * `.st-blend` like the words beside it.
 *
 * `data-transition-label` is the name, because every internal Link needs
 * one (trap 42) and the index's name is his — the same string the top-left
 * mark already carries to the same place.
 */
export default function Mark({ name }: { name: string }): React.ReactElement {
  const handle = useRef<LottieHandle>(null);
  const playing = useRef(false);

  const play = useCallback((): void => {
    const lottie = handle.current;
    if (lottie === null || playing.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    playing.current = true;
    lottie.seek(0);
    lottie.play();
  }, []);

  const subscriptions = useMemo(
    () => ({
      complete: () => {
        playing.current = false;
        // Back to frame 0, which is the whole M by construction.
        handle.current?.stop();
      }
    }),
    []
  );

  return (
    <Link
      href="/"
      aria-label={name}
      data-transition-label={name}
      className="st-mark block"
      onPointerEnter={play}
      onFocus={play}
    >
      <LottieSvg
        aria-hidden="true"
        className="h-full w-full"
        src={mark}
        autoplay={false}
        loop={false}
        lottieRef={handle}
        subscriptions={subscriptions}
      />
    </Link>
  );
}
