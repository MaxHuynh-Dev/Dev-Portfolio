import type React from 'react';
import type { Project } from '@/content/site';

import NextProject from './NextProject';
import ShotStack from './ShotStack';
import SpecSheet from './SpecSheet';

/**
 * A project page.
 *
 * Three columns, very unequal: a sticky spec sheet, a wide stack of shots,
 * and a thin rail of thumbnails. The spec column sticks — in the design
 * this follows it scrolls away, which leaves the left half of a long media
 * stack empty and makes you scroll back to check a detail.
 *
 * A server component. ShotStack is the only client leaf, because it owns
 * which shot is at eye level and the name's fit.
 */
export default function ProjectView({
  project,
  next
}: {
  project: Project;
  next: Project;
}): React.ReactElement {
  return (
    <>
      <article className="px-[var(--gut)] pt-[clamp(6.5rem,14vh,9rem)] pb-[clamp(3rem,8vh,5rem)]">
        <div className="flex flex-wrap items-start gap-x-[clamp(1.5rem,5vw,4.5rem)] gap-y-[clamp(2rem,5vh,3.5rem)]">
          <div className="w-full shrink-0 md:sticky md:top-[calc(var(--chrome-top)+1rem)] md:w-[clamp(13rem,21vw,17rem)]">
            <SpecSheet project={project} />
          </div>

          <ShotStack project={project} />
        </div>
      </article>

      <NextProject project={next} />
    </>
  );
}
