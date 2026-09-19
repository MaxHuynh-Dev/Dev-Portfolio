import Lines from '@Components/Lines';
import Reveal from '@Components/Reveal';
import Shot from '@Components/Shot';
import type React from 'react';
import type { About as AboutContent, Profile } from '@/content/site';

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
 * About.
 *
 * It was the quietest band at the foot of the index — one paragraph and two
 * short lists — and it is a page now. The band could be quiet because the
 * work list above it was doing the talking; a page has to carry itself.
 *
 * **The grammar is the project page's, deliberately.** A narrow column of
 * metadata on the left and the wide content on the right is exactly what
 * `/work/<slug>` already sets up, and reusing it is what makes this read as
 * another page of the same site rather than a second template. What changes
 * is what fills the two columns: prose instead of shots, and a portrait
 * instead of a rail of thumbnails.
 *
 * **The statement is the one new move.** The site's signature is display
 * type rising out of a mask cut to the ink — the preloader's letters, the
 * masthead on a route change, a project's name. Those are all ONE line that
 * never wraps. This is a sentence, so it breaks, and `Lines` is the only
 * thing here that knows where. `.st-statement` is the mask geometry for
 * type that does both.
 *
 * **There is no portrait yet, and that is a correct state.** `Shot` renders
 * a sized, labelled field, so the column, the rhythm and the page's length
 * are all right before a photograph exists. The two images already in
 * `public/images` are template stock — one of them a photograph of a
 * stranger — and dropping either in would be a claim about what the owner
 * looks like. That is the same rule that forbids inventing where he lives.
 */
export default function About({
  about,
  profile,
  colophon
}: {
  about: AboutContent;
  profile: Profile;
  colophon: string;
}): React.ReactElement {
  /** Where a column's label sits, counted across every column. */
  const columnStep = (index: number): number =>
    about.columns.slice(0, index).reduce((total, column) => total + 1 + column.items.length, 0);

  return (
    <article className="px-[var(--gut)] pt-[clamp(6.5rem,14vh,9rem)] pb-[clamp(5rem,12vh,8rem)]">
      <p className="st-meta m-0">
        <Reveal on="load" className="st-line block" delay={LEAD_MS}>
          <span className="st-line-body">about</span>
        </Reveal>
      </p>

      {/* The statement spans the whole column, the way the masthead does on
          the index — a band of type across the top that divides the page.
          The measure is wide on purpose: at this size a 42ch measure would
          break it into six short lines and read as a poem. */}
      {/* The statement IS the heading — `Lines` renders the h1 itself rather
          than sitting inside one. Wrapping it put a <p> inside an <h1>,
          which every browser keeps and which is invalid all the same: h1
          takes phrasing content and p is flow content. */}
      <Lines
        as="h1"
        on="load"
        delay={LEAD_MS + STATEMENT_MS}
        className="st-statement st-display m-0 mt-[clamp(1.2rem,3vh,2rem)] max-w-[18ch] text-[clamp(2rem,6.4vw,5.2rem)] text-[var(--ink)]"
      >
        {about.statement}
      </Lines>

      {/* THREE columns, which is the project page's grammar exactly: a
          narrow column of metadata, the content, and a narrow column of
          picture. Two columns left the right third of the page empty —
          measured at 1440, roughly 600px of it — and an empty third is the
          same fault the opening had before contact came up into it.

          The prose is FIRST in the DOM and second on screen. Nothing in
          either flanking column can take focus, so the two orders cannot
          disagree about anything a keyboard does; what the DOM order buys
          is the reading sequence — the statement, then the prose that
          answers it, then the lists, then the picture. */}
      <div className="mt-[clamp(3rem,9vh,6rem)] flex flex-wrap items-start justify-between gap-x-[clamp(1.5rem,4vw,3.5rem)] gap-y-[clamp(2.5rem,6vh,4rem)]">
        {/* The prose. One `Lines` per paragraph, because each one is
            measured and masked line by line and `Lines` takes exactly one —
            which is also why the CMS splits the textarea on blank lines
            rather than handing this a single string with breaks in it. */}
        <div className="order-1 flex min-w-0 flex-1 flex-col gap-[clamp(1.1rem,2.6vh,1.8rem)] md:order-2 md:max-w-[52ch]">
          {about.body.map((paragraph, index) => (
            <Lines
              key={paragraph.slice(0, 40)}
              on="load"
              delay={LEAD_MS + STATEMENT_MS + index * PROSE_MS}
              className="m-0 text-[clamp(1.05rem,2vw,1.35rem)] leading-[1.45]"
            >
              {paragraph}
            </Lines>
          ))}

          {/* What he is open to, set apart from the prose rather than
              inside it: it is the one line on this page that changes, and a
              reader looking for it should not have to read three paragraphs
              to find it. The address is not repeated — it is in the corner
              mark above, on every page. */}
          <p className="st-meta mt-[clamp(0.8rem,2vh,1.4rem)] mb-0">
            <Reveal
              on="load"
              className="st-line block"
              delay={LEAD_MS + STATEMENT_MS + about.body.length * PROSE_MS}
            >
              <span className="st-line-body">
                {profile.availability.toLowerCase()}, {profile.location.toLowerCase()}
              </span>
            </Reveal>
          </p>
        </div>

        {/* What he does and what he works with, in the left column — the
            spec sheet's position on a project page, and its width. */}
        <div className="order-2 w-full shrink-0 md:order-1 md:w-[clamp(10rem,15vw,13rem)]">
          <div className="flex flex-wrap gap-x-[clamp(1.5rem,3vw,2.5rem)] gap-y-[clamp(1.2rem,3vh,1.8rem)]">
            {about.columns.map((column, index) => {
              const start = columnStep(index);
              return (
                <div key={column.label}>
                  {/* The label names the list programmatically as well as
                      visually. Left as a loose <p> a screen reader reads
                      "list, 3 items" with nothing saying which list. */}
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
                    className="m-0 mt-[0.35rem] list-none p-0"
                  >
                    {column.items.map((item, position) => (
                      <li key={item} className="text-[0.95rem] leading-[1.6]">
                        <Reveal
                          on="load"
                          className="st-line block"
                          delay={LEAD_MS + STATEMENT_MS + (start + 1 + position) * COLUMN_MS}
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

        {/* The picture, where the project page puts its rail of thumbnails.
            `.st-wash` is opacity 0 until something sets `data-in` on it, so
            it has to be a `Reveal` and not a bare div — as a div the class
            is a permanent invisibility rather than a fade, which is exactly
            how it shipped for a moment here. An image has no lines to mask,
            so opacity is the whole gesture. */}
        <div className="order-3 w-full shrink-0 md:w-[clamp(11rem,18vw,15rem)]">
          <Reveal on="load" className="st-wash block" delay={LEAD_MS + STATEMENT_MS}>
            <Shot
              src={about.portrait === null ? null : about.portrait.src}
              alt={about.portrait === null ? '' : about.portrait.alt}
              ratio="4 / 5"
              label="portrait, 4:5"
              sizes="(max-width: 48rem) 100vw, 15rem"
              size={about.portrait === null ? null : about.portrait.size}
            />
          </Reveal>
        </div>
      </div>

      {/* The colophon, which used to be a band at the foot of the index and
          was redundant there — under a list of projects, an account of the
          typefaces reads as something left over. It belongs beside the
          account of who built the site.

          It is a `<footer>` for this article and not a footer BAND; there
          are none on this site, and one line of metadata at the end of a
          page is not one. It also carries the Font Awesome attribution,
          which is a licence obligation rather than a courtesy — see the
          contact marks in the opening. */}
      <footer className="mt-[clamp(4rem,12vh,7rem)]">
        <Lines
          on="load"
          delay={LEAD_MS + STATEMENT_MS + (about.body.length + 1) * PROSE_MS}
          className="st-measure st-meta m-0"
        >
          {colophon}
        </Lines>
      </footer>
    </article>
  );
}
