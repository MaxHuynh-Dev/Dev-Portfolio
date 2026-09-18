'use client';

import Lines from '@Components/Lines';
import { useFittedText } from '@Hooks/useFittedText';
import type React from 'react';
import { PROFILE } from '@/content/site';

const FULL_NAME = `${PROFILE.firstName} ${PROFILE.lastName}`;

/**
 * The opening.
 *
 * The name is measured and set to fill its column exactly — which is why
 * it can be this large without a fixed scale guessing at it, and why a
 * three-letter name and a seventeen-character one both land on the margin.
 *
 * That used to be exposed as a demo: the line was an editable field with a
 * readout of the two numbers it solved against. The machinery is unchanged
 * and the field is gone. With no editable element the line can be the real
 * <h1> again rather than a labelled control shadowed by a screen-reader-only
 * heading — the document outline no longer has to survive someone typing
 * into it.
 */
export default function Open(): React.ReactElement {
  const { ref } = useFittedText(FULL_NAME, {
    maxViewportFraction: 0.36,
    lineHeight: 0.9
  });

  return (
    <section
      id="open"
      aria-labelledby="open-heading"
      className="flex min-h-[100svh] flex-col justify-center px-[var(--gut)] pt-[clamp(7rem,13vh,9.5rem)] pb-[clamp(7rem,13vh,9.5rem)]"
    >
      {/* No mask, and nothing rises. The preloader flies this exact element
          up from the foot of its curtain into this slot, so the line is
          already here and already sized — there is nothing left to reveal.
          It finds the element by this id and only hands over when the text
          matches, which is why the name is built from PROFILE in both
          places. See Preloader/index.tsx. */}
      <h1
        ref={ref as React.RefObject<HTMLHeadingElement>}
        id="open-heading"
        className="st-display st-fit m-0 whitespace-nowrap text-[var(--ink)]"
      >
        {FULL_NAME}
      </h1>

      {/* The line under the name is what arrives on load — not the name.
          The curtain assembles its own copy of the masthead and hands it
          over already in place, so there is nothing left there to reveal,
          and revealing it anyway would break a handover that is currently
          exact to the pixel. This waits for the same release. */}
      <Lines
        on="load"
        delay={120}
        className="mt-[clamp(1.4rem,3.5vh,2.6rem)] max-w-[42ch] text-[clamp(1.05rem,2vw,1.45rem)] leading-[1.35] md:ml-auto"
      >
        {PROFILE.intro}
      </Lines>
    </section>
  );
}
