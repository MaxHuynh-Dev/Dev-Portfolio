import { shortest } from '@Hooks/useCarousel';
import type React from 'react';
import { memo } from 'react';
import type { Project } from '@/content/site';

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
 * It takes the projects and nothing else, and never re-renders: the array
 * arrives from a server component by way of `Library`, so its reference is
 * the same on every client re-render and `memo` still holds. The lines are
 * placed every frame by `Library`'s `draw`, off the same continuous position the covers are
 * placed from, so they roll *with* the ring rather than after it. React
 * only writes the pose below, which is that same law at position 0 — the
 * frame the server renders, and the one the first `draw` overwrites.
 */

/** Where line `index` sits when the ring stands at position 0. */
const initial = (index: number, count: number): string =>
  `translateY(${(shortest(index, count) * 110).toFixed(2)}%)`;

interface RolledProps {
  projects: Project[];
  /** Goes on every line, so they are all the same size and all roll alike. */
  className: string;
  render: (project: Project, index: number) => React.ReactNode;
}

/** One line of the readout, with every project's version of it stacked. */
function Rolled({ projects, className, render }: RolledProps): React.ReactElement {
  return (
    <span className="st-roll">
      {projects.map((project, index) => (
        <span
          key={project.slug}
          className={`st-roll-line ${className}`}
          style={{ transform: initial(index, projects.length) }}
        >
          {render(project, index)}
        </span>
      ))}
    </span>
  );
}

function Readout({ projects }: { projects: Project[] }): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      // SIX cells in two rows, not three columns each holding a stack.
      //
      // `items-baseline` aligns the items of one ROW on a shared baseline,
      // so the structure has to match what is meant to line up. Stacked in
      // three columns, only the first row could ever align: the number, the
      // name and the year are set at two different sizes, so their boxes are
      // different heights, and whatever sat under them started from a
      // different place — `/ 08` and the summary were 1.5px apart at 375 and
      // 4px at 1024. Splitting the rows lets each one find its own baseline.
      //
      // Aligning the TOPS instead is what was here before, and it is wrong
      // for the same reason it looked wrong: what the eye reads as a row of
      // type is the line it sits on, not the box it is in. The gap between
      // the two was 6px at 320 and 14px at 1024, and it moves with the width
      // because the two clamps do not hold a fixed ratio across their range.
      className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-[clamp(0.6rem,2.5vw,2.5rem)]"
    >
      <span className="block">
        <Rolled
          projects={projects}
          className="st-display block text-[clamp(1.1rem,3.6vw,3rem)] text-[var(--ink)] tabular-nums"
          render={(_project, index) => String(index + 1).padStart(2, '0')}
        />
      </span>

      <span className="block min-w-0">
        <Rolled
          projects={projects}
          className="st-display block text-[clamp(1.5rem,5vw,3.6rem)] text-[var(--ink)]"
          render={(project) => project.name}
        />
      </span>

      <span className="st-display st-display-reg block text-[clamp(1.1rem,3.6vw,3rem)]">
        <Rolled
          projects={projects}
          className="block text-[var(--ink)] tabular-nums"
          render={(project) => project.year}
        />
      </span>

      <span className="st-meta block tabular-nums">
        / {String(projects.length).padStart(2, '0')}
      </span>

      <span className="block min-w-0">
        <Rolled
          projects={projects}
          className="st-meta block leading-[1.45]"
          render={(project) => project.summary}
        />
      </span>
    </div>
  );
}

export default memo(Readout);
