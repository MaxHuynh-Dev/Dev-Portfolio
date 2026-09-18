import { shortest } from '@Hooks/useCarousel';
import type React from 'react';
import { memo } from 'react';
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
 *
 * It takes no props and never re-renders. The lines are placed every frame
 * by `Library`'s `draw`, off the same continuous position the covers are
 * placed from, so they roll *with* the ring rather than after it. React
 * only writes the pose below, which is that same law at position 0 — the
 * frame the server renders, and the one the first `draw` overwrites.
 */

/** Where line `index` sits when the ring stands at position 0. */
const initial = (index: number): string =>
  `translateY(${(shortest(index, PROJECTS.length) * 110).toFixed(2)}%)`;

interface RolledProps {
  /** Goes on every line, so they are all the same size and all roll alike. */
  className: string;
  render: (project: Project, index: number) => React.ReactNode;
}

/** One line of the readout, with every project's version of it stacked. */
function Rolled({ className, render }: RolledProps): React.ReactElement {
  return (
    <span className="st-roll">
      {PROJECTS.map((project, index) => (
        <span
          key={project.slug}
          className={`st-roll-line ${className}`}
          style={{ transform: initial(index) }}
        >
          {render(project, index)}
        </span>
      ))}
    </span>
  );
}

function Readout(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-[auto_1fr_auto] items-start gap-x-[clamp(0.6rem,2.5vw,2.5rem)]"
    >
      <span className="block">
        <Rolled
          className="st-display block text-[clamp(1.1rem,3.6vw,3rem)] text-[var(--ink)] tabular-nums"
          render={(_project, index) => String(index + 1).padStart(2, '0')}
        />
        <span className="st-meta block tabular-nums">
          / {String(PROJECTS.length).padStart(2, '0')}
        </span>
      </span>

      <span className="block min-w-0">
        <Rolled
          className="st-display block text-[clamp(1.5rem,5vw,3.6rem)] text-[var(--ink)]"
          render={(project) => project.name}
        />
        <Rolled className="st-meta block leading-[1.45]" render={(project) => project.summary} />
      </span>

      <span className="st-display st-display-reg block text-[clamp(1.1rem,3.6vw,3rem)]">
        <Rolled
          className="block text-[var(--ink)] tabular-nums"
          render={(project) => project.year}
        />
      </span>
    </div>
  );
}

export default memo(Readout);
