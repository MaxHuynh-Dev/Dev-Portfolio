'use client';

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
      <div className="st-rise-mask pb-[0.12em]">
        <div className="st-rise">
          <h1
            ref={ref as React.RefObject<HTMLHeadingElement>}
            id="open-heading"
            className="st-display st-fit m-0 whitespace-nowrap text-[var(--ink)]"
          >
            {FULL_NAME}
          </h1>
        </div>
      </div>

      <p className="mt-[clamp(1.4rem,3.5vh,2.6rem)] max-w-[42ch] text-[clamp(1.05rem,2vw,1.45rem)] leading-[1.35] md:ml-auto">
        {PROFILE.intro}
      </p>
    </section>
  );
}
