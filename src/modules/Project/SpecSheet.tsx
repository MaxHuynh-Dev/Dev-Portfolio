import Lines from '@Components/Lines';
import Reveal from '@Components/Reveal';
import type React from 'react';
import type { Project } from '@/content/site';

/**
 * How the column arrives, in one place.
 *
 * Held after the page is let go, then one row every `STEP_MS`. The lead is
 * shorter than the name's beside it and the step is quick, because this is
 * eight or nine short rows: a stagger long enough to read as a sequence
 * here would still be running when the reader has finished the page.
 */
const LEAD_MS = 200;
const STEP_MS = 52;
/** Within a field, between its own lines. Tighter — these belong together. */
const SUB_MS = 22;

const at = (step: number, sub = 0): number => LEAD_MS + step * STEP_MS + sub * SUB_MS;

function Field({
  label,
  step,
  children
}: {
  label: string;
  /** Its place in the stagger, counted down the column. */
  step: number;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <p className="st-meta m-0">
        <Reveal on="load" className="st-line block" delay={at(step)}>
          <span className="st-line-body">{label}</span>
        </Reveal>
      </p>
      <div className="mt-[0.25rem] text-[0.95rem] leading-[1.55]">{children}</div>
    </div>
  );
}

/**
 * The project's spec sheet.
 *
 * Labels sit above their values rather than beside them. The design this
 * was modelled on splits the column into label and value tracks, which is
 * handsome at its width and turns into two cramped columns at this one;
 * stacking also matches how the About section on the home page is set.
 *
 * Every row comes up out of its own mask, one after the next, while the
 * project's name rises beside it and the first shot washes in. That is the
 * whole arrival gesture on this page — there was none at all before, which
 * made a project the one place on the site where the curtain opened onto a
 * still picture.
 *
 * It is a mask per line and not a fade-and-slide on the column, which is
 * the thing this repo threw out: a single treatment applied to every block
 * on a page is the generated-page tell, and it is also less honest here,
 * because these rows really are lines of type and they really do arrive one
 * at a time. The one exception is the shot, which has no lines to mask.
 *
 * There is no `recognition` field. That is where the source lists
 * Awwwards, CSSDA and FWA, and this site does not carry award claims it
 * cannot stand behind.
 */
export default function SpecSheet({ project }: { project: Project }): React.ReactElement {
  return (
    <div className="flex flex-col gap-[clamp(1.4rem,3vh,2.2rem)]">
      <Field label="about" step={0}>
        {/* Prose, so the breaks are measured rather than guessed — one mask
            per line the paragraph actually has at this width. */}
        <Lines on="load" delay={at(0, 1)} className="m-0">
          {project.about}
        </Lines>
      </Field>

      <Field label="role" step={1}>
        <ul className="m-0 list-none p-0">
          {project.role.map((item, index) => (
            <li key={item}>
              <Reveal on="load" className="st-line block" delay={at(1, index + 1)}>
                <span className="st-line-body">{item}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </Field>

      <Field label="stack" step={2}>
        <ul className="m-0 list-none p-0">
          {project.stack.map((item, index) => (
            <li key={item}>
              <Reveal on="load" className="st-line block" delay={at(2, index + 1)}>
                <span className="st-line-body">{item}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </Field>

      <Field label="launch" step={3}>
        <p className="m-0 tabular-nums">
          <Reveal on="load" className="st-line block" delay={at(3, 1)}>
            <span className="st-line-body">{project.year}</span>
          </Reveal>
        </p>
      </Field>

      {/* Absent rather than dead: a link with nowhere to go is worse than
          no link, and most of these will have nowhere to go for a while. */}
      {project.url !== null ? (
        <p className="m-0">
          <Reveal on="load" className="st-line block" delay={at(4)}>
            <a
              className="st-link st-line-body text-[1.05rem]"
              href={project.url}
              rel="noreferrer noopener"
              target="_blank"
            >
              Visit the site
            </a>
          </Reveal>
        </p>
      ) : null}
    </div>
  );
}
