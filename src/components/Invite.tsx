import Reveal from '@Components/Reveal';
import type React from 'react';
import type { Profile } from '@/content/site';

/** One masked row, the same idiom as every other small block here. */
function Row({
  delay,
  className,
  children
}: {
  delay: number;
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Reveal on="scroll" className={`st-line block ${className ?? ''}`} delay={delay}>
      <span className="st-line-body">{children}</span>
    </Reveal>
  );
}

/**
 * The invitation at the foot of a page that runs long.
 *
 * A reader who has scrolled to the end of a project or of the CV has just
 * done the thing a portfolio is for, and until this there was nothing at
 * that moment asking them to do anything about it — the address was in the
 * corner the whole way down, and a corner mark is furniture, not a
 * question.
 *
 * **The address is not repeated.** It is in the top-right corner mark on
 * every page, and the opening once carried it a second time 400px away,
 * which the owner read as exactly that (trap 38). So the link is WORDS that
 * open a mail to it — the corner says where, this says "do it now".
 *
 * **Nor is the availability line.** It was the heading here for one
 * build, and the bottom-left corner mark says the same words on every
 * page — photographed, `open to work` twice, 200px apart. So the label
 * asks a question instead, which is what a label over a mail link is for.
 * The CV sits under the link when the Profile has one, and is simply absent
 * when it does not.
 */
export default function Invite({
  profile,
  className
}: {
  profile: Profile;
  className?: string;
}): React.ReactElement {
  return (
    <section aria-labelledby="invite-heading" className={className}>
      <h2 id="invite-heading" className="st-meta m-0 font-[500] text-[var(--ink)]">
        <Row delay={0}>have a project in mind?</Row>
      </h2>

      {/* `leading-[normal]` is the face's own box, so the mask cannot shave
          a cap or a descender (trap 26). */}
      <p className="m-0 mt-[0.3rem] text-[clamp(1.6rem,3.2vw,2.6rem)] leading-[normal]">
        <Row delay={60}>
          <a className="st-display st-link text-[var(--ink)]" href={`mailto:${profile.email}`}>
            get in touch
          </a>
        </Row>
      </p>

      {profile.cv !== null ? (
        <p className="st-meta m-0 mt-[0.5rem]">
          <Row delay={120}>
            <a
              className="st-link text-[var(--ink)]"
              href={profile.cv}
              rel="noreferrer noopener"
              target="_blank"
            >
              read the cv
            </a>
          </Row>
        </p>
      ) : null}
    </section>
  );
}
