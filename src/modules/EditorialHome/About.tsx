import { ImageWell } from '@Components/editorial/ImageWell';
import { MetaColumns } from '@Components/editorial/MetaColumns';
import { MonoLabel } from '@Components/editorial/MonoLabel';
import { ABOUT_META, PORTRAIT, PROFILE } from '@Modules/EditorialHome/constants';
import type React from 'react';

/** Portrait beside a statement, a bio, and three columns of hard facts. */
export const About = (): React.JSX.Element => (
  <section
    id="about"
    aria-labelledby="about-head"
    className="ed-rule-t relative z-[2] px-[var(--gut)] py-[clamp(3rem,7vw,6rem)]"
  >
    <div className="grid items-start gap-[clamp(1.75rem,4vw,4rem)] [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <div className="ed-reveal relative aspect-[3/4] w-full overflow-hidden">
        <ImageWell
          src={PORTRAIT}
          alt={`${PROFILE.firstName} ${PROFILE.lastName}`}
          placeholder="Portrait"
          sizes="(max-width: 900px) 100vw, 40vw"
        />
      </div>

      <div className="ed-reveal flex flex-col gap-[clamp(1.25rem,2.5vw,2rem)]">
        <MonoLabel as="h2" id="about-head" wide dim className="m-0 font-normal">
          About
        </MonoLabel>

        <p className="m-0 max-w-[34ch] text-[clamp(1.15rem,2.1vw,1.85rem)] leading-[1.28] tracking-[-0.02em] [text-wrap:pretty]">
          {PROFILE.statement}
        </p>

        <p className="m-0 max-w-[52ch] text-[0.98rem] text-[var(--ed-body)] leading-[1.55] [text-wrap:pretty]">
          {PROFILE.bio}
        </p>

        <MetaColumns columns={ABOUT_META} className="ed-rule-t pt-[1.1rem]" />
      </div>
    </div>
  </section>
);

export default About;
