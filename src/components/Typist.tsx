'use client';

import Reveal from '@Components/Reveal';
import { useReleased } from '@Hooks/useReveal';
import type { AnimationItem } from 'lottie-web';
import type React from 'react';
import { useEffect, useRef } from 'react';

/** Written by `scripts/typing-lottie.mjs`; any Lottie at this path plays. */
const SRC = '/lottie/typing.json';
/** The pose shown under reduced motion: hands down, eyes on the reader — the illustration's own. */
const STILL_FRAME = 115;

/**
 * The owner at a laptop, typing — the field of paper above the masthead.
 *
 * **It takes the room, it does not make any.** `flex-1` with a zero basis
 * and `min-h-0` means it grows into whatever the section has left over and
 * shrinks to nothing when there is none, so the masthead sits exactly where
 * it sat without it (the preloader lands on that `<h1>` to the pixel — trap
 * 10) and the index is still one screen at every size (trap 41). The
 * drawing then fits that box by its own aspect, standing on its foot.
 *
 * **The player loads after the page is let go.** Lottie is ~150KB of
 * script, and the index's first job is the name; so the import and the
 * file are fetched once `useReleased` says the curtain is off, and the
 * picture washes in the way the portrait on `/about` does. The LIGHT
 * player: SVG only, no expressions, which is all a drawn file needs.
 *
 * Under `prefers-reduced-motion` it is a still frame, never a loop.
 */
export default function Typist({ label }: { label: string }): React.ReactElement {
  const box = useRef<HTMLDivElement | null>(null);
  const released = useReleased();

  useEffect(() => {
    if (!released || box.current === null) return;
    const container = box.current;
    let item: AnimationItem | null = null;
    let cancelled = false;

    void (async () => {
      const [{ default: lottie }, response] = await Promise.all([
        import('lottie-web/build/player/lottie_light'),
        fetch(SRC)
      ]);
      if (cancelled || !response.ok) return;
      const animationData = (await response.json()) as object;
      if (cancelled) return;

      const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      item = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: !still,
        autoplay: !still,
        animationData,
        rendererSettings: {
          // Standing on its foot: the bottom of the drawing is the bottom
          // of the box, which is the line just above the name.
          preserveAspectRatio: 'xMidYMax meet',
          progressiveLoad: false
        }
      });
      if (still) item.goToAndStop(STILL_FRAME, true);
    })();

    return () => {
      cancelled = true;
      item?.destroy();
    };
  }, [released]);

  return (
    <Reveal
      on="load"
      delay={200}
      className="st-wash pointer-events-none flex max-h-[28rem] min-h-0 flex-[1_1_0] pb-[clamp(0.75rem,2vh,1.5rem)]"
    >
      {/* The label is the drawing's whole account; the SVG Lottie writes is
          left out of the tree beneath it. */}
      <div ref={box} role="img" aria-label={label} className="h-full w-full [&_svg]:block" />
    </Reveal>
  );
}
