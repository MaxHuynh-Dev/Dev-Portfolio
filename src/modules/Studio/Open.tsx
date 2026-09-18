'use client';

import Headline from '@Components/Headline';
import Lines from '@Components/Lines';
import { useFittedText } from '@Hooks/useFittedText';
import { useViaRoute } from '@Hooks/useReveal';
import type React from 'react';
import type { Profile } from '@/content/site';

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
export default function Open({ profile }: { profile: Profile }): React.ReactElement {
  // Built here from the same two fields MainLayout builds it from, and
  // that agreement is load-bearing: the entry curtain finds this heading
  // by matching its own assembled copy against this text.
  const FULL_NAME = `${profile.firstName} ${profile.lastName}`;

  const { ref } = useFittedText(FULL_NAME, {
    maxViewportFraction: 0.36,
    lineHeight: 0.9
  });

  // The name is the largest thing on the first screen, and on the load path
  // it is also the one thing that has already been introduced — the curtain
  // spells it out letter by letter and puts it here. On the route path
  // nothing has introduced it, so it introduces itself.
  const viaRoute = useViaRoute();

  return (
    <section
      id="open"
      aria-labelledby="open-heading"
      className="flex min-h-[100svh] flex-col justify-center px-[var(--gut)] pt-[clamp(7rem,13vh,9.5rem)] pb-[clamp(7rem,13vh,9.5rem)]"
    >
      {/* On the LOAD path this is bare, and that is not an oversight. The
          preloader assembles its own copy of this line at this line's own
          size and position and hands it over exact to the pixel; a mask
          here would be a second opinion about where the name belongs. It
          finds the element by this id and only hands over when the text
          matches, which is why the name is built from PROFILE in both
          places. See Preloader/index.tsx.

          On the ROUTE path nobody has introduced the name, so it comes up
          out of a mask like the rest of the page. `Headline` renders
          nothing at all when it is not wanted, so the load path's markup is
          unchanged rather than merely inert. */}
      {/* mb-[0.185em] is the descender's own room, given back.
          .st-display sets line-height 0.9 and Nippo's natural box is
          1.269em, so the ink hangs (1.269 - 0.9) / 2 = 0.185em below the
          heading's box. Whatever is set after the heading measures its
          margin from that box, so the tail of the `y` ate the gap — and ate
          it in proportion to the name, which is why it looked fine at the
          width anyone was testing at. Measured on a 900px viewport, the gap
          from the ink to the paragraph ran 25.5px at 320, 15.7 at 768, 1.8
          at 1440 and -8.6 at 1920, where the two collided. A rem in the
          paragraph's own margin cannot fix it: that is one number against a
          heading whose size is solved per width (trap 11). An em here IS
          the heading's size, by construction.

          A MARGIN and not padding, and that part is not cosmetic. The
          preloader lands its letters on `getBoundingClientRect().top` of
          this element — the border box — so padding would have moved the
          target out from under a handover that is currently exact to the
          pixel. A margin leaves that box untouched and still moves what
          comes after it.

          And it is the face's box, not this string's ink, so a name with no
          descender at all sits the same distance off what follows it. */}
      <h1
        ref={ref as React.RefObject<HTMLHeadingElement>}
        id="open-heading"
        className="st-display st-fit mt-0 mr-0 mb-[0.185em] ml-0 whitespace-nowrap text-[var(--ink)]"
      >
        <Headline enabled={viaRoute} delay={40}>
          {FULL_NAME}
        </Headline>
      </h1>

      {/* The line under the name is what arrives on load — not the name.
          The curtain assembles its own copy of the masthead and hands it
          over already in place, so there is nothing left there to reveal,
          and revealing it anyway would break a handover that is currently
          exact to the pixel. This waits for the same release. */}
      <Lines
        on="load"
        delay={viaRoute ? 340 : 120}
        className="mt-[clamp(1.4rem,3.5vh,2.6rem)] max-w-[42ch] text-[clamp(1.05rem,2vw,1.45rem)] leading-[1.35] md:ml-auto"
      >
        {profile.intro}
      </Lines>
    </section>
  );
}
