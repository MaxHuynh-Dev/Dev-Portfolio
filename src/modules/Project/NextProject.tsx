import Link from 'next/link';
import type React from 'react';
import type { Project } from '@/content/site';

/**
 * The way out of a project, and into the next one.
 *
 * Left-aligned like everything else on this site. The design this was
 * modelled on centres and underlines it, which is handsome there and would
 * be the only centred thing here — an exception that would read as a
 * mistake rather than a decision.
 */
export default function NextProject({ project }: { project: Project }): React.ReactElement {
  return (
    <section
      aria-labelledby="next-heading"
      className="px-[var(--gut)] pt-[clamp(3.5rem,10vh,7rem)] pb-[clamp(8rem,17vh,11rem)]"
    >
      <h2 id="next-heading" className="st-meta m-0 font-[500] text-[var(--ink)]">
        next project
      </h2>

      <Link
        href={`/work/${project.slug}`}
        data-transition-label={project.name}
        className="mt-[0.5rem] block"
      >
        <span className="st-display block text-[clamp(2.2rem,10vw,7.5rem)] text-[var(--ink)] leading-[0.95]">
          {project.name}
        </span>
        <span className="st-meta mt-[0.4rem] block">
          {project.kind.toLowerCase()}, <span className="tabular-nums">{project.year}</span>
        </span>
      </Link>
    </section>
  );
}
