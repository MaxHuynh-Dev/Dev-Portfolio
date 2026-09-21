import Lines from "@Components/Lines";
import Reveal from "@Components/Reveal";
import Shot from "@Components/Shot";
import type React from "react";
import type { About as AboutContent, Profile } from "@/content/site";

/**
 * How the page arrives, in one place.
 *
 * The statement goes first because it is the largest thing on the page and
 * the first thing read; the column of metadata follows it rather than
 * racing it, and the prose comes last because it is the part the reader
 * will still be on when everything else has settled.
 */
const LEAD_MS = 200;
const STATEMENT_MS = 60;
const COLUMN_MS = 52;
const PROSE_MS = 90;

/**
 * About — one screen, and it had to be cut to get there.
 *
 * It was 1.3 screens on a desktop and **2.43 at 320x568**, measured. Asked
 * to hold a single viewport it could not simply be squeezed: the page was
 * three stacked bands with generous air between them, and on a phone the
 * portrait alone was a full-width 4:5 field 338-456px tall. What follows is
 * what went, and why each one was the right thing to lose rather than the
 * easy thing.
 *
 * - **The `about` eyebrow is gone.** A small label reading `about`, above
 *   an `<h1>`, on a page reached by a corner mark that says `about`, behind
 *   a curtain that spells ABOUT across the whole screen on the way in. Four
 *   sayings of one word. Worth 46px and it was the only one that cost
 *   nothing at all.
 * - **The portrait is punctuation on a phone, not a band.** Full width it
 *   was over 60% of a 320x568 screen for a field with no photograph in it.
 *   It sits beside the metadata now at a fixed small width, which is the
 *   size the genre actually uses it at — the research behind trap 39 found
 *   a 129px square doing this job on a page that reads as a person, and
 *   found three of seven pages with no portrait at all.
 * - **The air between the bands.** 81px above the columns and 108px above
 *   the foot at 1440. Both were sized when this page could be as long as it
 *   liked.
 * - **The statement gives up a line, not its size.** Its measure went from
 *   18ch to 26ch, which takes the placeholder from three lines to two and
 *   saves ~94px at 1440 without touching the type scale. It is still the
 *   one large move on the page.
 *
 * **What did NOT go is the content.** Every paragraph, both lists and the
 * availability line all still render, in full, from the CMS. This is a
 * layout that fits the content, not a page that drops it — which also means
 * the fit is a property of how much is written. See the budget in trap 43.
 *
 * **The colophon is gone, and it took a licence with it.** It carried the
 * Font Awesome attribution, which is why trap 39 recorded that this block
 * could not simply be deleted. Deleting it meant removing the obligation
 * first: the contact marks in the opening are Tabler now, MIT, and nothing
 * on this site needs a notice any more. See `SocialIcon.tsx`.
 *
 * **The grammar is still the project page's**, which is what makes this
 * read as another page of the same site: a narrow column of metadata, the
 * content, and a narrow column of picture.
 */
export default function About({
  about,
  profile,
}: {
  about: AboutContent;
  profile: Profile;
}): React.ReactElement {
  /** Where a column's label sits, counted across every column. */
  const columnStep = (index: number): number =>
    about.columns
      .slice(0, index)
      .reduce((total, column) => total + 1 + column.items.length, 0);

  return (
    <article className="flex min-h-[100svh] flex-col px-[var(--gut)] pt-[clamp(6.5rem,14vh,9rem)] pb-[clamp(5rem,12vh,8rem)]">
      {/* `my-auto` and NOT `justify-center`, and the difference only shows
          when the content does not fit. Flex centring overflows in BOTH
          directions, and the half that goes up goes under the fixed corner
          marks and cannot be scrolled back to — there is no scroll above
          zero. Auto margins collapse to nothing the moment free space runs
          out, so a page that outgrows its screen simply starts at the top
          and scrolls down like any other. */}
      <div className="my-auto">
        {/* The statement IS the heading — `Lines` renders the h1 itself
            rather than sitting inside one. Wrapping it put a <p> inside an
            <h1>, which every browser keeps and which is invalid all the
            same: h1 takes phrasing content and p is flow content.

            26ch, up from 18ch. At 18ch the placeholder broke into three
            lines of display type and spent 283px of a 666px budget at
            1440x900; at 26ch it is two. The measure is the knob here, not
            the size — this is the page's one large move and shrinking it
            would be paying for the fit with the thing being bought. */}
        <Lines
          as="h1"
          on="load"
          delay={LEAD_MS}
          className="st-statement st-display m-0 max-w-[26ch] text-[clamp(2rem,6.4vw,5.2rem)] text-[var(--ink)]"
        >
          {about.statement}
        </Lines>

        {/* THREE columns, which is the project page's grammar exactly: a
            narrow column of metadata, the content, and a narrow column of
            picture.

            The prose is FIRST in the DOM and second on screen. Nothing in
            either flanking column can take focus, so the two orders cannot
            disagree about anything a keyboard does; what the DOM order buys
            is the reading sequence — the statement, then the prose that
            answers it, then the lists, then the picture. */}
        <div className="mt-[clamp(1.6rem,4vh,2.6rem)] flex flex-col gap-y-[clamp(1.4rem,3.5vh,2.2rem)] md:flex-row md:items-stretch md:justify-between md:gap-x-[clamp(1.5rem,4vw,3.5rem)]">
          {/* The prose. One `Lines` per paragraph, because each one is
              measured and masked line by line and `Lines` takes exactly one
              — which is also why the CMS splits the textarea on blank lines
              rather than handing this a single string with breaks in it. */}
          <div className="flex min-w-0 flex-1 flex-col gap-[clamp(0.8rem,1.8vh,1.3rem)] md:order-2 md:max-w-[58ch]">
            {about.body.map((paragraph, index) => (
              <Lines
                key={paragraph.slice(0, 40)}
                on="load"
                delay={LEAD_MS + STATEMENT_MS + index * PROSE_MS}
                className="m-0 text-[clamp(1rem,1.6vw,1.2rem)] leading-[1.45]"
              >
                {paragraph}
              </Lines>
            ))}

            {/* What he is open to, set apart from the prose rather than
                inside it: it is the one line on this page that changes, and
                a reader looking for it should not have to read three
                paragraphs to find it. The address is not repeated — it is
                in the corner mark above, on every page. */}
            <p className="st-meta mt-[clamp(0.4rem,1.2vh,0.9rem)] mb-0">
              <Reveal
                on="load"
                className="st-line block"
                delay={LEAD_MS + STATEMENT_MS + about.body.length * PROSE_MS}
              >
                <span className="st-line-body">
                  {profile.availability.toLowerCase()},{" "}
                  {profile.location.toLowerCase()}
                </span>
              </Reveal>
            </p>
          </div>

          {/* **`md:contents` is what lets one markup serve both shapes.**
              On a phone these two are a ROW — the lists taking what width
              they need and the portrait a small fixed column beside them —
              because stacked they cost 556px of a 395px budget. Above `md`
              this wrapper stops generating a box at all, so its two
              children become items of the row above and take their places
              as the outer and inner columns of the project page's grammar.

              A plain div with no semantics, so `display: contents` has
              nothing to drop out of the accessibility tree. */}
          <div className="flex items-start gap-x-[clamp(1.25rem,5vw,2.5rem)] md:contents">
            {/* What he does and what he works with — the spec sheet's
                position on a project page, and its width. */}
            <div className="min-w-0 flex-1 md:order-1 md:w-[clamp(9rem,14vw,12rem)] md:flex-none">
              <div className="flex flex-wrap gap-x-[clamp(1.25rem,3vw,2.5rem)] gap-y-[clamp(0.9rem,2.2vh,1.4rem)]">
                {about.columns.map((column, index) => {
                  const start = columnStep(index);
                  return (
                    <div key={column.label}>
                      {/* The label names the list programmatically as well
                          as visually. Left as a loose <p> a screen reader
                          reads "list, 3 items" with nothing saying which
                          list. */}
                      <p className="st-meta m-0" id={`about-${column.label}`}>
                        <Reveal
                          on="load"
                          className="st-line block"
                          delay={LEAD_MS + STATEMENT_MS + start * COLUMN_MS}
                        >
                          <span className="st-line-body">{column.label}</span>
                        </Reveal>
                      </p>
                      <ul
                        aria-labelledby={`about-${column.label}`}
                        className="m-0 mt-[0.3rem] list-none p-0"
                      >
                        {column.items.map((item, position) => (
                          <li
                            key={item}
                            className="text-[0.95rem] leading-[1.55]"
                          >
                            <Reveal
                              on="load"
                              className="st-line block"
                              delay={
                                LEAD_MS +
                                STATEMENT_MS +
                                (start + 1 + position) * COLUMN_MS
                              }
                            >
                              <span className="st-line-body">{item}</span>
                            </Reveal>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* The picture, where the project page puts its rail of
                thumbnails. `.st-wash` is opacity 0 until something sets
                `data-in` on it, so it has to be a `Reveal` and not a bare
                div — as a div the class is a permanent invisibility rather
                than a fade, which is exactly how it shipped for a moment
                here. An image has no lines to mask, so opacity is the whole
                gesture. */}
            {/* **The height is the prose column's, not a ratio.** The row
                is `items-stretch` above `md`, so this box is exactly as
                tall as the tallest thing in the row — which is the prose,
                and the last line of the prose is `open to work`. The two
                bottom edges are one line by construction rather than by a
                width tuned until they looked level, and they stay one line
                when the prose reflows or a paragraph is added.

                On a phone the row is the metadata's, roughly 100px, and
                stretching to THAT would shrink the picture rather than grow
                it. So the mobile box keeps a declared 4:5 and `md:aspect-auto`
                hands the height over at the breakpoint.

                **No `h-full` on this wrapper, and that is the whole bug
                this cost.** `height: 100%` resolves against the parent's
                height, the row's height is `auto`, and an auto height
                resolving a percentage child that is itself asking for a
                percentage is circular — it collapses to 0. Measured exactly
                that way: a 228px-wide frame **0px tall** at every width
                above `md`, while every other number on the page stayed
                correct. `align-items: stretch` has ALREADY given this item
                a definite cross size; asking for it a second time is what
                took it away. Below it, `h-full` on the Reveal and on
                `Shot`'s box is fine, because by then the parent is
                definite. */}
            <div className="aspect-[4/5] w-[clamp(5.5rem,26vw,8rem)] shrink-0 md:order-3 md:aspect-auto md:w-[clamp(9rem,16vw,15rem)]">
              <Reveal
                on="load"
                className="st-wash block h-full"
                delay={LEAD_MS + STATEMENT_MS}
              >
                <Shot
                  stretch
                  src={about.portrait === null ? null : about.portrait.src}
                  alt={about.portrait === null ? "" : about.portrait.alt}
                  ratio="4 / 5"
                  label="portrait"
                  sizes="(max-width: 48rem) 26vw, 15rem"
                  size={about.portrait === null ? null : about.portrait.size}
                />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
