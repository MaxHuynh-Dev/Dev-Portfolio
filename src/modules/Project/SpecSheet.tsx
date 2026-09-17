import type React from 'react';
import type { Project } from '@/content/site';

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div>
      <p className="st-meta m-0">{label}</p>
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
 * There is no `recognition` field. That is where the source lists
 * Awwwards, CSSDA and FWA, and this site does not carry award claims it
 * cannot stand behind.
 */
export default function SpecSheet({ project }: { project: Project }): React.ReactElement {
  return (
    <div className="flex flex-col gap-[clamp(1.4rem,3vh,2.2rem)]">
      <Field label="about">
        <p className="m-0">{project.about}</p>
      </Field>

      <Field label="role">
        <ul className="m-0 list-none p-0">
          {project.role.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Field>

      <Field label="stack">
        <ul className="m-0 list-none p-0">
          {project.stack.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Field>

      <Field label="launch">
        <p className="m-0 tabular-nums">{project.year}</p>
      </Field>

      {/* Absent rather than dead: a link with nowhere to go is worse than
          no link, and most of these will have nowhere to go for a while. */}
      {project.url !== null ? (
        <p className="m-0">
          <a
            className="st-link text-[1.05rem]"
            href={project.url}
            rel="noreferrer noopener"
            target="_blank"
          >
            Visit the site
          </a>
        </p>
      ) : null}
    </div>
  );
}
