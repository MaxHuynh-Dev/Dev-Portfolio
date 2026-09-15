import { ImageWell } from '@Components/editorial/ImageWell';
import { MonoLabel } from '@Components/editorial/MonoLabel';
import { SectionHead } from '@Components/editorial/SectionHead';
import { FEATURED_COUNT, PROJECTS, WORK_RANGE } from '@Modules/EditorialHome/constants';
import type React from 'react';

const featured = PROJECTS.slice(0, FEATURED_COUNT);

/** Two large cards — the only place project imagery appears at size. */
export const Work = (): React.JSX.Element => (
  <section
    id="work"
    aria-labelledby="work-head"
    className="relative z-[2] px-[var(--gut)] pt-[clamp(3rem,7vw,6rem)] pb-[clamp(2rem,5vw,4rem)]"
  >
    <SectionHead
      label="Selected work"
      headingId="work-head"
      meta={WORK_RANGE}
      className="ed-reveal"
    />

    <div className="grid gap-[clamp(1.5rem,3vw,2.5rem)] pt-[clamp(1.5rem,3vw,2.5rem)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,22rem),1fr))]">
      {featured.map((project, index) => (
        <a
          key={project.no}
          href={project.href}
          className="ed-reveal group flex flex-col gap-[0.9rem]"
        >
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            {/* Decorative here: the h3 and description below already name
                the project, so an alt would duplicate the link's own name. */}
            <ImageWell
              src={project.image}
              alt=""
              placeholder={`${project.name} — hero frame`}
              priority={index === 0}
            />
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <h3 className="m-0 font-medium text-[clamp(1.3rem,2.4vw,2rem)] tracking-[-0.03em] transition-colors duration-200 group-hover:text-[var(--ed-accent)] group-focus-visible:text-[var(--ed-accent)]">
              {project.name}
            </h3>
            <MonoLabel dim>
              {project.year} · {project.kind}
            </MonoLabel>
          </div>

          {project.description ? (
            <p className="m-0 max-w-[44ch] text-[0.95rem] text-[var(--ed-body)] leading-[1.45]">
              {project.description}
            </p>
          ) : null}
        </a>
      ))}
    </div>
  </section>
);

export default Work;
