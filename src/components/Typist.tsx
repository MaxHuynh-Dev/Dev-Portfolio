'use client';

import Reveal from '@Components/Reveal';
import { useReleased } from '@Hooks/useReveal';
import { fetchJson, LOTTIE_TYPING, LOTTIE_WAVE, loadPlayer } from '@Utils/lottie';
import type { AnimationItem } from 'lottie-web';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

/** The pose shown under reduced motion: hands down, eyes on the reader — the illustration's own. */
const STILL_FRAME = 115;
/** Under reduced motion a click shows the wave's still pose — his drawing, hand up — for this long. */
const WAVE_STILL_MS = 1600;
/**
 * The button is the drawing and not the row it sits in: the file's own ratio,
 * as wide as the box allows or as tall — whichever binds — and on the box's
 * foot, which is exactly where `xMidYMax meet` puts the picture. Sized with
 * container units off the box, because `h-full` with an aspect ratio stops
 * being that ratio the moment `max-w-full` clamps it: at 414x896 the button
 * was 376x418 round a 274px-tall picture, and a press on the paper above him
 * waved.
 */
const CANVAS = 'aspect-[137/100] w-[min(100cqw,137cqh)]';

const REDUCE = '(prefers-reduced-motion: reduce)';

/**
 * The owner at a laptop, typing — the field of paper above the masthead —
 * and, pressed, looking up to wave.
 *
 * **It takes the room, it does not make any.** `flex-1` with a zero basis
 * and `min-h-0` means it grows into whatever the section has left over and
 * shrinks to nothing when there is none, so the masthead sits exactly where
 * it sat without it (the preloader lands on that `<h1>` to the pixel — trap
 * 10) and the index is still one screen at every size (trap 41). The
 * drawing then fits that box by its own aspect, standing on its foot.
 *
 * **The wave is a second Lottie laid over the first, on paper.** Both files
 * share one canvas and the same laptop and mug to the pixel (the script
 * lends the wave the typing drawing's own), and the wave's layer has an
 * opaque paper ground. So fading it in and out cross-fades only the PERSON:
 * where the two files agree the paper-backed top layer is exactly what is
 * under it, at every opacity. Two transparent files faded against each
 * other would thin the laptop to three-quarter ink halfway through. The
 * typing loop is paused under the wave and picks up where it was.
 *
 * **The player loads after the page is let go.** Lottie is ~150KB of
 * script, and the index's first job is the name; so the import and both
 * files are fetched once `useReleased` says the curtain is off, and the
 * picture washes in the way the portrait on `/about` does. The LIGHT
 * player: SVG only, no expressions, which is all a drawn file needs.
 *
 * Under `prefers-reduced-motion` the typing is a still frame, never a loop,
 * and a press swaps in the wave's still pose for a moment instead of
 * playing it — a change of picture, not a movement.
 */
export default function Typist({ label }: { label: string }): React.ReactElement {
  const typingBox = useRef<HTMLDivElement | null>(null);
  const waveBox = useRef<HTMLDivElement | null>(null);
  const typing = useRef<AnimationItem | null>(null);
  const wave = useRef<AnimationItem | null>(null);
  const still = useRef(false);
  const holding = useRef<number | undefined>(undefined);
  const [waving, setWaving] = useState(false);
  const released = useReleased();

  useEffect(() => {
    if (!released || typingBox.current === null || waveBox.current === null) return;
    const typingContainer = typingBox.current;
    const waveContainer = waveBox.current;
    const items: AnimationItem[] = [];
    let cancelled = false;

    void (async () => {
      const [lottie, typingData, waveData] = await Promise.all([
        loadPlayer(),
        fetchJson(LOTTIE_TYPING),
        fetchJson(LOTTIE_WAVE)
      ]);
      if (cancelled || typingData === null) return;

      still.current = window.matchMedia(REDUCE).matches;
      const rendererSettings = {
        // Standing on its foot: the bottom of the drawing is the bottom
        // of the box, which is the line just above the name.
        preserveAspectRatio: 'xMidYMax meet',
        progressiveLoad: false
      };
      const loop = lottie.loadAnimation({
        container: typingContainer,
        renderer: 'svg',
        loop: !still.current,
        autoplay: !still.current,
        animationData: typingData,
        rendererSettings
      });
      if (still.current) loop.goToAndStop(STILL_FRAME, true);
      typing.current = loop;
      items.push(loop);

      if (waveData === null) return;
      const hello = lottie.loadAnimation({
        container: waveContainer,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: waveData,
        rendererSettings
      });
      hello.goToAndStop(0, true);
      hello.addEventListener('complete', () => {
        setWaving(false);
      });
      wave.current = hello;
      items.push(hello);
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(holding.current);
      for (const item of items) item.destroy();
      typing.current = null;
      wave.current = null;
    };
  }, [released]);

  // The loop stands still under the wave, and carries on from that pose.
  useEffect(() => {
    const loop = typing.current;
    if (loop === null || still.current) return;
    if (waving) loop.pause();
    else loop.play();
  }, [waving]);

  const onPress = () => {
    const hello = wave.current;
    if (hello === null || waving) return;
    setWaving(true);
    if (still.current) {
      hello.goToAndStop(0, true);
      holding.current = window.setTimeout(() => {
        setWaving(false);
      }, WAVE_STILL_MS);
    } else {
      hello.goToAndPlay(0, true);
    }
  };

  return (
    <Reveal
      on="load"
      delay={200}
      className="st-wash pointer-events-none flex max-h-[28rem] min-h-0 flex-[1_1_0] pb-[clamp(0.75rem,2vh,1.5rem)] [container-type:size]"
    >
      {/* The label is the drawing's whole account and says what a press
          does; the SVGs Lottie writes are left out of the tree beneath it. */}
      <button
        type="button"
        onClick={onPress}
        aria-label={`${label}. Press to wave hello.`}
        className={`pointer-events-auto mx-auto mt-auto grid cursor-[var(--cursor-pointer)] grid-cols-1 grid-rows-1 ${CANVAS}`}
      >
        <div
          ref={typingBox}
          aria-hidden="true"
          className="col-start-1 row-start-1 h-full w-full [&_svg]:block"
        />
        {/* `relative z-[1]` is what makes the paper opaque. Lottie puts a
            transform on each SVG, which paints it in the positioned layer —
            AFTER every plain block's background. So at full opacity this
            box's paper was drawn under the typing SVG, and the figure
            showed through the wave; mid-fade it looked right, because
            opacity under 1 made the box its own stacking context. */}
        <div
          ref={waveBox}
          aria-hidden="true"
          data-on={waving}
          className="relative z-[1] col-start-1 row-start-1 h-full w-full bg-[var(--paper)] opacity-0 transition-opacity duration-[var(--t-quick)] data-[on=true]:opacity-100 [&_svg]:block"
        />
      </button>
    </Reveal>
  );
}
