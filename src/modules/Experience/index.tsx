import Lines from '@Components/Lines';
import Odometer from '@Components/Odometer';
import Reveal from '@Components/Reveal';
import Link from 'next/link';
import type React from 'react';
import type { Month, Position } from '@/content/site';

/**
 * How one position arrives, in one place.
 *
 * The year starts counting first because it is the slowest thing in the
 * entry — 1.4s of wheels — and the company's name comes up beside it while
 * the low digits are still spinning, so the two land as one gesture. The
 * rest follows down the column.
 */
const NAME_MS = 120;
const ROLE_MS = 260;
const LABEL_MS = 340;
const ITEM_MS = 90;

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const monthLabel = (value: Month): string => `${MONTHS[value.month - 1]} ${value.year}`;

/** `may 2023 – now`. An en dash, because it is a range. */
/** `autonomous.ai` from `https://www.autonomous.ai/` — the link says where it goes. */
const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const periodOf = (position: Position): string =>
  `${monthLabel(position.start)} – ${position.end === null ? 'now' : monthLabel(position.end)}`;

/** One masked row of `.st-meta`, or of body type. */
function Row({
  delay,
  className,
  children
}: {
  delay: number;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Reveal on="scroll" className={`st-line block ${className ?? ''}`} delay={delay}>
      <span className="st-line-body">{children}</span>
    </Reveal>
  );
}

function Field({
  label,
  id,
  delay,
  items
}: {
  label: string;
  id: string;
  delay: number;
  items: React.ReactNode[];
}): React.ReactElement {
  return (
    <div>
      <p className="st-meta m-0" id={id}>
        <Row delay={delay}>{label}</Row>
      </p>
      <ul
        aria-labelledby={id}
        className="m-0 mt-[0.3rem] list-none p-0 text-[0.95rem] leading-[1.55]"
      >
        {items.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a fixed list rendered once, never reordered
          <li key={index}>
            <Row delay={delay + (index + 1) * 40}>{item}</Row>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Entry({ position, index }: { position: Position; index: number }): React.ReactElement {
  const id = `position-${index}`;
  const afterItems = LABEL_MS + (position.responsibilities.length + 1) * ITEM_MS;

  return (
    <li className="flex flex-col gap-y-[clamp(0.9rem,2.4vh,1.6rem)] lg:grid lg:grid-cols-[clamp(13rem,21vw,17rem)_minmax(0,1fr)] lg:gap-x-[clamp(1.5rem,5vw,4.5rem)]">
      {/* The company, and everything about the job. FIRST in the DOM and
          second on screen, so a screen reader meets the heading before the
          year that sits to its left — nothing in the year column can take
          focus, so the two orders cannot disagree about a keyboard. */}
      <div className="min-w-0 lg:order-2">
        {/* `leading-[normal]` is the face's own box, so the mask cannot
            shave a cap or a descender — and it is the SAME box the year's
            odometer beside it uses, which is what puts the two on one
            baseline at one size without a number for it. */}
        {/* The heading IS the split element, not wrapped around it: a
            block inside an <h2> is the invalid nesting trap 39 records. */}
        <Lines
          as="h2"
          on="scroll"
          delay={NAME_MS}
          className="st-display m-0 text-[clamp(2.2rem,5.4vw,4.6rem)] text-[var(--ink)] leading-[normal]"
        >
          {position.company}
        </Lines>

        <p className="m-0 mt-[0.35rem] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-[1.35]">
          <Row delay={ROLE_MS}>{position.role.toLowerCase()}</Row>
        </p>

        {/* Above `lg` the lists move out to a third column, which is the
            project page's grammar whole: dates where the spec sheet is, the
            prose in the middle, and a narrow column on the right. Left in
            the middle they left ~500px of the right third empty at 1440 —
            the fault trap 39 records on the first build of /about. */}
        <div className="mt-[clamp(1.4rem,3.4vh,2.2rem)] flex flex-col gap-[clamp(1.4rem,3vh,2rem)] lg:flex-row lg:justify-between lg:gap-x-[clamp(1.5rem,4vw,3.5rem)]">
          {position.responsibilities.length > 0 ? (
            <div className="min-w-0 lg:flex-1">
              <p className="st-meta m-0" id={`${id}-did`}>
                <Row delay={LABEL_MS}>responsibilities</Row>
              </p>
              <ul
                aria-labelledby={`${id}-did`}
                className="st-measure m-0 mt-[0.4rem] flex list-none flex-col gap-[0.7rem] p-0"
              >
                {position.responsibilities.map((item, line) => (
                  <li key={item}>
                    {/* Prose, so its breaks are measured — one mask per line
                        the item really has at this width. */}
                    <Lines
                      on="scroll"
                      delay={LABEL_MS + (line + 1) * ITEM_MS}
                      className="m-0 text-[clamp(1rem,1.4vw,1.1rem)] leading-[1.5]"
                    >
                      {item}
                    </Lines>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {position.stack.length > 0 || position.projects.length > 0 ? (
            <div className="flex flex-wrap gap-x-[clamp(2rem,6vw,4.5rem)] gap-y-[1.4rem] lg:w-[clamp(9rem,14vw,12rem)] lg:flex-none lg:flex-col">
              {position.stack.length > 0 ? (
                <Field label="stack" id={`${id}-stack`} delay={afterItems} items={position.stack} />
              ) : null}
              {position.projects.length > 0 ? (
                <Field
                  label="projects"
                  id={`${id}-projects`}
                  delay={afterItems + 60}
                  items={position.projects.map((project) => (
                    // Every internal Link carries the label the route
                    // curtain spells out (trap 42).
                    <Link
                      key={project.slug}
                      className="st-link"
                      href={`/work/${project.slug}`}
                      data-transition-label={project.name}
                    >
                      {project.name}
                    </Link>
                  ))}
                />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* The year it started, counting itself in, and the exact months
          under it. Regular weight against the name's bold: the two share a
          size and a line, so the weight is what says which one is the
          heading.

          On a phone the months sit BESIDE the year rather than under it:
          stacked, they would come between the year and the company's name
          and split the one pair that has to read together. */}
      <div className="order-first flex items-end justify-between gap-x-4 lg:order-1 lg:block">
        <p className="st-display st-display-reg m-0 text-[clamp(2.2rem,5.4vw,4.6rem)] text-[var(--ink)]">
          <Odometer value={position.start.year} />
        </p>
        <p className="st-meta m-0 pb-[0.35em] text-right lg:mt-[0.2rem] lg:pb-0 lg:text-left">
          <Row delay={ROLE_MS}>{periodOf(position)}</Row>
          {position.location !== null ? (
            <Row delay={ROLE_MS + 40}>{position.location.toLowerCase()}</Row>
          ) : null}
          {/* The company's own site, named by its address rather than a
              repeated "Visit the site" — two links with one name on one
              page is two links a screen reader cannot tell apart. Absent
              rather than dead when the CMS has none. */}
          {position.url !== null ? (
            <Row delay={ROLE_MS + 80}>
              <a
                className="st-link text-[var(--ink)]"
                href={position.url}
                rel="noreferrer noopener"
                target="_blank"
              >
                {hostOf(position.url)}
              </a>
            </Row>
          ) : null}
        </p>
      </div>
    </li>
  );
}

/**
 * Experience — where he has worked, newest first.
 *
 * A server component; the only client leaves are the masks and the
 * odometer, which each own their own reveal. It is the project page's
 * grammar turned on its side: a narrow column on the left carrying the
 * dates, where the spec sheet would be, and the content beside it.
 *
 * **Unlike every other page, this one reveals on `scroll`.** It is the
 * first page since the index lost its work list whose content is allowed
 * to run past the screen — a CV grows — and `scroll` is the trigger
 * `useReveal` kept for exactly that (trap 24). Whatever is on screen when
 * the curtain lets go comes up at once, because the scroll trigger asks
 * "is it at or above the line", which is already true for it.
 *
 * There is no visible `<h1>`. The corner mark says `experience` and the
 * route curtain spells it across the screen on the way in; a label saying
 * it a third time above the first entry is the eyebrow trap 43 took off
 * `/about`. The heading is still in the document for a screen reader.
 */
export default function Experience({ positions }: { positions: Position[] }): React.ReactElement {
  return (
    <article className="px-[var(--gut)] pt-[clamp(6.5rem,14vh,9rem)] pb-[clamp(6rem,14vh,9rem)]">
      <h1 className="sr-only">Experience</h1>

      {positions.length === 0 ? (
        <p className="st-meta m-0">nothing here yet.</p>
      ) : (
        <ol className="m-0 flex list-none flex-col gap-y-[clamp(4rem,12vh,7.5rem)] p-0">
          {positions.map((position, index) => (
            <Entry
              key={`${position.company}-${position.start.year}-${position.start.month}`}
              position={position}
              index={index}
            />
          ))}
        </ol>
      )}
    </article>
  );
}
