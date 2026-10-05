'use client';

import Reveal from '@Components/Reveal';
import { useReleased } from '@Hooks/useReveal';
import { fetchJson, LOTTIE_TYPING, LOTTIE_WAVE, loadPlayer } from '@Utils/lottie';
import type { AnimationItem } from 'lottie-web';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

/**
 * The pose he rests in: hands down, eyes on the reader — the illustration's
 * own. Under reduced motion it is the only pose; otherwise the typing plays
 * up to it once and stops there.
 */
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
 * typing is paused under the wave and picks up where it was.
 *
 * **It types once, then rests — it does not loop.** A loop that starts on
 * its own and never stops fails WCAG 2.2.2 (Pause, Stop, Hide) unless the
 * page offers a control to stop it, and a reduced-motion setting is not
 * one. So the file plays from its first frame to `STILL_FRAME` — 3.8s,
 * under the criterion's five — and holds the pose the illustration was
 * drawn in, eyes up on the reader. A press still waves, which is motion
 * the reader asked for, and he settles back into the same pose after.
 *
 * **The player loads after the page is let go.** Lottie is ~150KB of
 * script, and the index's first job is the name; so the import and the
 * typing file are fetched once `useReleased` says the curtain is off, and
 * the picture washes in the way the portrait on `/about` does. The LIGHT
 * player: SVG only, no expressions, which is all a drawn file needs.
 *
 * **The wave is fetched on intent, not on arrival.** `wave.json` is ~104KB
 * and most readers never press; so it is asked for when a pointer comes
 * onto the drawing or focus reaches it, which is well before a click lands,
 * and a press that beats it simply waits for it.
 *
 * Under `prefers-reduced-motion` the typing is a still frame from the start,
 * and a press swaps in the wave's still pose for a moment instead of
 * playing it — a change of picture, not a movement.
 */
export default function Typist({ label }: { label: string }): React.ReactElement {
  const typingBox = useRef<HTMLDivElement | null>(null);
  const waveBox = useRef<HTMLDivElement | null>(null);
  const typing = useRef<AnimationItem | null>(null);
  const wave = useRef<AnimationItem | null>(null);
  const still = useRef(false);
  /** The one pass of typing has reached the resting pose. */
  const rested = useRef(false);
  const holding = useRef<number | undefined>(undefined);
  const [waving, setWaving] = useState(false);
  const released = useReleased();
  /** What the wave needs from the typing effect: the player and its settings. */
  const player = useRef<{
    lottie: Awaited<ReturnType<typeof loadPlayer>>;
    settings: { preserveAspectRatio: string; progressiveLoad: boolean };
  } | null>(null);
  /** The wave's load, started once and shared by every caller. */
  const waveLoad = useRef<Promise<AnimationItem | null> | null>(null);
  const items = useRef<AnimationItem[]>([]);

  const prepareWave = (): Promise<AnimationItem | null> => {
    if (waveLoad.current !== null) return waveLoad.current;
    const ready = player.current;
    const container = waveBox.current;
    if (ready === null || container === null) return Promise.resolve(null);
    waveLoad.current = fetchJson(LOTTIE_WAVE).then((waveData) => {
      if (waveData === null || player.current === null) return null;
      const hello = ready.lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: waveData,
        rendererSettings: ready.settings
      });
      hello.goToAndStop(0, true);
      hello.addEventListener('complete', () => {
        setWaving(false);
      });
      wave.current = hello;
      items.current.push(hello);
      return hello;
    });
    return waveLoad.current;
  };

  useEffect(() => {
    if (!released || typingBox.current === null || waveBox.current === null) return;
    const typingContainer = typingBox.current;
    const live = items.current;
    let cancelled = false;

    void (async () => {
      const [lottie, typingData] = await Promise.all([loadPlayer(), fetchJson(LOTTIE_TYPING)]);
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
        loop: false,
        autoplay: false,
        animationData: typingData,
        rendererSettings
      });
      // Exactly on the pose, not wherever the last tick of the segment
      // happened to land.
      loop.addEventListener('complete', () => {
        rested.current = true;
        loop.goToAndStop(STILL_FRAME, true);
      });
      if (still.current) {
        rested.current = true;
        loop.goToAndStop(STILL_FRAME, true);
      } else {
        loop.playSegments([0, STILL_FRAME], true);
      }
      typing.current = loop;
      live.push(loop);
      player.current = { lottie, settings: rendererSettings };
    })();

    return () => {
      cancelled = true;
      window.clearTimeout(holding.current);
      for (const item of live) item.destroy();
      live.length = 0;
      typing.current = null;
      wave.current = null;
      player.current = null;
      waveLoad.current = null;
    };
  }, [released]);

  // The typing stands still under the wave and carries on from that pose —
  // unless it had already come to rest, in which case it stays at rest.
  useEffect(() => {
    const loop = typing.current;
    if (loop === null || still.current || rested.current) return;
    if (waving) loop.pause();
    else loop.play();
  }, [waving]);

  const onPress = async () => {
    if (waving) return;
    const hello = wave.current ?? (await prepareWave());
    if (hello === null) return;
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
        onClick={() => {
          void onPress();
        }}
        onPointerEnter={() => {
          void prepareWave();
        }}
        onFocus={() => {
          void prepareWave();
        }}
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
