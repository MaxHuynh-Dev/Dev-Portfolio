'use client';

import Headline from '@Components/Headline';
import Lines from '@Components/Lines';
import Reveal from '@Components/Reveal';
import SocialIcon, { markFor } from '@Components/SocialIcon';
import { useFittedText } from '@Hooks/useFittedText';
import { usePressure } from '@Hooks/usePressure';
import { useViaRoute } from '@Hooks/useReveal';
import type React from 'react';
import type { LinkColumn, Profile } from '@/content/site';

/**
 * How the opening arrives, in one place.
 *
 * The lead differs by path because the two curtains hand the page back
 * differently: the preloader lets go mid-dissolve, so the paper is still
 * clearing and there is nothing to wait for, while the route panel hands
 * over a clear screen a moment before anything is asked to move.
 */
const LEAD_LOAD_MS = 120;
const LEAD_ROUTE_MS = 340;
/** Between one masked row and the next. The same step the spec sheet uses. */
const STEP_MS = 52;
/** The contact register starts straight after the intro: the first
 *  group label IS the region heading, so there is no separate row. */
const LINKS_STEP = 1;

/**
 * The opening.
 *
 * The name is measured and set to fill its column exactly — which is why
 * it can be this large without a fixed scale guessing at it, and why a
 * three-letter name and a seventeen-character one both land on the margin.
 *
 * **The masthead is a rule made of type**: fitted, it starts on the left
 * margin and ends on the right one, so it divides the first screen into an
 * above and a below. What was under it was a single paragraph pushed to the
 * right by `ml-auto` — which put both of the screen's heavy objects, the
 * name and the intro, against the same edge. Measured at 1440x900 the
 * result was a dead rectangle 810x228 in the lower left, and 1195x187 at
 * 1920. The hero did not lack content; it lacked balance.
 *
 * So the register below the rule is now a left/right pair, which is the
 * grammar the rest of the page already speaks — the corner marks are a
 * left/right pair at every edge of the viewport. The contact block anchors
 * under the START of the name and the intro stays under its END, where the
 * eye already finishes reading it.
 *
 * **The intro comes first in the DOM and second on screen**, and the two
 * can disagree here without costing anything: a paragraph holds no focus,
 * so the only tab stops on this screen are the address and the links, all
 * of them inside one block and all in order. What the order buys is the
 * reading sequence a screen reader gets — name, then what the work is, then
 * how to reach him.
 *
 * **The address is not repeated here.** It lives in the top-right corner
 * mark, which is chrome — on every page, never re-rendered across a
 * navigation — and one screen carrying it twice was one time too many. What
 * the opening carries is the set of places the work lives, as the brands'
 * own marks rather than as words, which the corner does not carry at all.
 */
export default function Open({
  profile,
  links
}: {
  profile: Profile;
  links: LinkColumn[];
}): React.ReactElement {
  // Built here from the same two fields MainLayout builds it from, and
  // that agreement is load-bearing: the entry curtain finds this heading
  // by matching its own assembled copy against this text.
  const FULL_NAME = `${profile.firstName} ${profile.lastName}`;

  const { ref } = useFittedText(FULL_NAME, {
    maxViewportFraction: 0.36,
    lineHeight: 0.9
  });

  // Its letters thin away from the pointer once the page is the reader's.
  // It never touches the text above — see usePressure for why the handover
  // and the fit are both still exact.
  usePressure(ref, FULL_NAME);

  // The name is the largest thing on the first screen, and on the load path
  // it is also the one thing that has already been introduced — the curtain
  // spells it out letter by letter and puts it here. On the route path
  // nothing has introduced it, so it introduces itself.
  const viaRoute = useViaRoute();

  const lead = viaRoute ? LEAD_ROUTE_MS : LEAD_LOAD_MS;
  const at = (step: number): number => lead + step * STEP_MS;

  /**
   * Where a column's label sits in the stagger.
   *
   * Counted across every column rather than restarted per column, so the
   * rows come up one after another down the whole block instead of two
   * columns racing each other.
   */
  const columnStep = (index: number): number =>
    LINKS_STEP +
    links.slice(0, index).reduce((total, column) => total + 1 + column.links.length, 0);

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
          matches, which is why the name is built from the profile in both
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
          descender at all sits the same distance off what follows it.

          It is also a DIRECT CHILD of the section, and has to stay one:
          `useFittedText` solves against its container's content box, so a
          wrapper between the two would hand the fit a width that is not the
          column's (trap 8). */}
      <h1
        ref={ref as React.RefObject<HTMLHeadingElement>}
        id="open-heading"
        className="st-display st-fit relative mt-0 mr-0 mb-[0.185em] ml-0 whitespace-nowrap text-[var(--ink)]"
      >
        <Headline enabled={viaRoute} delay={40}>
          {FULL_NAME}
        </Headline>
      </h1>

      <div className="flex flex-col gap-[clamp(2.2rem,5vh,3.4rem)] md:flex-row md:items-start md:justify-between md:gap-[clamp(2rem,6vw,5rem)]">
        {/* The line under the name is what arrives on load — not the name.
            The curtain assembles its own copy of the masthead and hands it
            over already in place, so there is nothing left there to reveal,
            and revealing it anyway would break a handover that is currently
            exact to the pixel. This waits for the same release. */}
        <Lines
          on="load"
          delay={at(0)}
          className="m-0 max-w-[42ch] text-[clamp(1.05rem,2vw,1.45rem)] leading-[1.35] md:order-2"
        >
          {profile.intro}
        </Lines>

        {/* Contact, folded up out of the foot of the page and given the
            emptiest quarter of the first screen. It keeps its own id, so the
            #contact is still a stable anchor for a link written elsewhere,
            and it is still a labelled region rather than a loose pile of
            links inside the opening. The corner marks no longer point at it:
            a mark that said `contact` and arrived at a row named
            `social` was worse than no mark.

            **The group's own label IS the region's heading.** There were two
            of them for a moment — a hardcoded `contact` over a group called
            `social` — and stacked like that they named the same six links
            twice, one line apart. The word comes from the CMS now, which is
            also the only place that knows how many groups there are: the
            first is the heading, and a second would sit under it with a
            label of its own. */}
        <section id="contact" aria-labelledby="contact-heading" className="md:order-1 md:shrink-0">
          {/* The address is NOT repeated here. It sits in the top-right
              corner mark, which is on every page of the site and never
              re-renders across a navigation, and one screen carrying it
              twice was one time too many. What is left is the set of places
              the work lives, which the corner does not carry.

              Marks rather than words, and the accessible name is unchanged:
              the label the CMS holds is still in the link, as visually
              hidden text, so a screen reader reads "GitHub" exactly as it
              did when the word was the visible thing. An unknown label
              falls back to that word — the links come out of a CMS where
              anyone can add a row called anything, and a mark that does not
              exist must not become a link with nothing in it. */}
          <div className="flex flex-wrap gap-x-[clamp(1.75rem,4vw,3.5rem)] gap-y-[clamp(1rem,2vh,1.5rem)]">
            {links.map((column, index) => {
              const start = columnStep(index);
              const Label = index === 0 ? 'h2' : 'p';
              return (
                <div key={column.label}>
                  <Label
                    {...(index === 0
                      ? {
                          id: 'contact-heading',
                          className: 'st-meta m-0 font-[500] text-[var(--ink)]'
                        }
                      : { className: 'st-meta m-0' })}
                  >
                    <Reveal on="load" className="st-line block" delay={at(start)}>
                      <span className="st-line-body">{column.label}</span>
                    </Reveal>
                  </Label>
                  <ul className="st-icon-row mt-[0.3rem] list-none p-0">
                    {column.links.map((link, item) => {
                      const mark = markFor(link.label);
                      return (
                        <li key={link.label} className="text-[0.95rem] leading-[1.6]">
                          <Reveal on="load" className="st-line block" delay={at(start + 1 + item)}>
                            {mark === null ? (
                              <a
                                className="st-link st-line-body mx-[0.5rem]"
                                href={link.href}
                                rel="noreferrer noopener"
                                target="_blank"
                              >
                                {link.label}
                              </a>
                            ) : (
                              // The mask's body has to be the block that
                              // travels, so the anchor sits INSIDE it rather
                              // than being it: .st-line-body is display:block
                              // and the icon link is an inline-flex box that
                              // centres its mark.
                              <span className="st-line-body">
                                <a
                                  className="st-icon-link"
                                  href={link.href}
                                  rel="noreferrer noopener"
                                  target="_blank"
                                >
                                  <SocialIcon
                                    label={link.label}
                                    className="h-[1.25rem] w-[1.25rem]"
                                  />
                                  <span className="sr-only">{link.label}</span>
                                </a>
                              </span>
                            )}
                          </Reveal>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
