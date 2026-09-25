import Invite from '@Components/Invite';
import type React from 'react';
import type { Profile, Project } from '@/content/site';

import NextProject from './NextProject';
import PinnedColumn from './PinnedColumn';
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
 *
 * Every shot arrives already knowing its own proportions. Payload records
 * a file's width and height when it is uploaded, so the shape is settled
 * before the page is built rather than discovered by the browser as each
 * image lands: ShotStack places the rail's marker from where each shot's
 * centre falls, and a column that grew under the reader would move all of
 * them.
 */
export default function ProjectView({
  project,
  next,
  profile
}: {
  project: Project;
  next: Project;
  profile: Profile;
}): React.ReactElement {
  const shotSizes = project.shots.map((shot) => shot.size);

  return (
    <>
      <article className="px-[var(--gut)] pt-[clamp(6.5rem,14vh,9rem)] pb-[clamp(3rem,8vh,5rem)]">
        <div className="flex flex-wrap items-start gap-x-[clamp(1.5rem,5vw,4.5rem)] gap-y-[clamp(2rem,5vh,3.5rem)]">
          {/* Sticks under the top chrome, or — when the sheet is taller than
              the room — scrolls until its foot is clear of the bottom chrome
              and sticks there. See PinnedColumn. */}
          <PinnedColumn className="w-full shrink-0 lg:sticky lg:w-[clamp(13rem,21vw,17rem)]">
            <SpecSheet project={project} />
          </PinnedColumn>

          <ShotStack project={project} shotSizes={shotSizes} />
        </div>
      </article>

      {/* The foot is a left/right pair, the grammar the corner marks and
          the opening already speak: the way on through the work on the
          left, and the way to the person who made it on the right —
          bottom-aligned, so the invitation's link sits on the line the
          next project's name ends on. Stacked on a phone, next first,
          because reading on is the commoner want. */}
      <div className="flex flex-col gap-y-[clamp(3rem,8vh,5rem)] px-[var(--gut)] pt-[clamp(3.5rem,10vh,7rem)] pb-[clamp(8rem,17vh,11rem)] lg:flex-row lg:items-end lg:justify-between lg:gap-x-[clamp(2rem,6vw,5rem)]">
        <NextProject project={next} />
        <Invite profile={profile} className="lg:shrink-0" />
      </div>
    </>
  );
}
