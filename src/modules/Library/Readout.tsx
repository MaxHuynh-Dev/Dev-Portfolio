import { shortest } from '@Hooks/useCarousel';
import type React from 'react';
import { PROJECTS, type Project } from '@/content/site';

/**
 * What the ring is pointing at: its place in the list, its name, its one
 * line, and its year.
 *
 * `aria-hidden`, because every word of it is already in the accessible name
 * of the link the ring is showing — the same arrangement as the index's
 * preview aside. It is a picture of the list, not a second copy of it.
 *
 * The counter is a counter, not an ordinal on the project. A numbered
 * marker earns its place when the content is a sequence and a set of
 * projects is not one; what this reports is where in the list you are
 * standing, which is exactly what the index's own `01 / 08` reports.
 */

/** Parked a mask-height above, at rest, or a mask-height below. */
const park = (index: number, active: number): string => {
  const away = shortest(index - active, PROJECTS.length);
  if (away === 0) return 'translateY(0%)';
  return away > 0 ? 'translateY(110%)' : 'translateY(-110%)';
};

interface RolledProps {
  active: number;
  /** Goes on every line, so they are all the same size and all park alike. */
  className: string;
  render: (project: Project, index: number) => React.ReactNode;
}

/** One line of the readout, with every project's version of it stacked. */
function Rolled({ active, className, render }: RolledProps): React.ReactElement {
  return (
    <span className="st-roll">
      {PROJECTS.map((project, index) => (
        <span
          key={project.slug}
          className={`st-roll-line ${className}`}
          style={{ transform: park(index, active) }}
        >
          {render(project, index)}
        </span>
      ))}
    </span>
  );
}

export default function Readout({ active }: { active: number }): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[auto_1fr_auto] items-start gap-x-[clamp(0.6rem,2.5vw,2.5rem)]"
    >
      <span className="block">
        <Rolled
          active={active}
          className="st-display block text-[clamp(1.1rem,3.6vw,3rem)] text-[var(--ink)] tabular-nums"
          render={(_project, index) => String(index + 1).padStart(2, '0')}
        />
        <span className="st-meta block tabular-nums">
          / {String(PROJECTS.length).padStart(2, '0')}
        </span>
      </span>

      <span className="block min-w-0">
        <Rolled
          active={active}
          className="st-display block text-[clamp(1.5rem,5vw,3.6rem)] text-[var(--ink)]"
          render={(project) => project.name}
        />
        <Rolled
          active={active}
          className="st-meta block leading-[1.45]"
          render={(project) => project.summary}
        />
      </span>

      <span className="st-display st-display-reg block text-[clamp(1.1rem,3.6vw,3rem)]">
        <Rolled
          active={active}
          className="block text-[var(--ink)] tabular-nums"
          render={(project) => project.year}
        />
      </span>
    </div>
  );
}
