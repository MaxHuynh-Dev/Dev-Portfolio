import { MonoLabel } from '@Components/editorial/MonoLabel';
import { HERO_META, PROFILE } from '@Modules/EditorialHome/constants';
import type React from 'react';

/**
 * The name at maximum scale, split across two lines and mask-revealed.
 * Type is capped against viewport height so it never collides with the
 * fixed bottom HUD on short screens.
 */
export const Hero = (): React.JSX.Element => (
  <section
    id="top"
    aria-label="Introduction"
    className="relative z-[2] grid min-h-[100svh] grid-rows-[auto_1fr_auto] gap-[clamp(1rem,3vh,2.5rem)] px-[var(--gut)] pt-[clamp(3.75rem,11vh,9rem)] pb-[calc(clamp(0.9rem,2.4vh,2.25rem)+4.6rem)]"
  >
    {/* The name is split across two visual corners. An explicit aria-label
        wins over name-from-content, so assistive tech gets it once and whole
        no matter how the painted halves are arranged. */}
    <h1
      aria-label={`${PROFILE.firstName} ${PROFILE.lastName}`}
      className="ed-display ed-hero-type relative z-[2] m-0 flex flex-col"
    >
      <span aria-hidden="true" className="block self-start overflow-hidden py-[0.06em]">
        <span className="block animate-[ed-rise_1.1s_cubic-bezier(.16,.84,.28,1)_.05s_both]">
          {PROFILE.firstName}
        </span>
      </span>
    </h1>

    <div className="relative z-[2] flex items-end justify-between gap-6">
      <a
        href="#work"
        className="ed-label inline-flex animate-[ed-fade_1s_ease_.6s_both] items-center gap-[0.6rem] border-[var(--ed-rule-strong)] border-b pb-[0.3rem]"
      >
        Scroll
        <span aria-hidden="true" className="animate-[ed-blink_1.2s_steps(1,end)_infinite]">
          ↓
        </span>
      </a>

      <div aria-hidden="true" className="ed-display ed-hero-type">
        <span className="block overflow-hidden py-[0.06em]">
          <span className="block animate-[ed-rise_1.1s_cubic-bezier(.16,.84,.28,1)_.16s_both]">
            {PROFILE.lastName}
          </span>
        </span>
      </div>
    </div>

    <div className="ed-rule-t relative z-[2] grid animate-[ed-fade_1s_ease_.5s_both] gap-[clamp(0.9rem,2.4vw,3rem)] pt-[1.1rem] [grid-template-columns:repeat(auto-fit,minmax(min(100%,12rem),1fr))]">
      {HERO_META.map((column) => (
        <div key={column.label} className="flex flex-col gap-[0.5rem]">
          <MonoLabel dim>{column.label}</MonoLabel>
          {column.items.map((item) => (
            <MonoLabel key={item}>{item}</MonoLabel>
          ))}
        </div>
      ))}

      {/* The source design hid this below 760px of viewport height. It is the
          only place PROFILE.intro appears, so hiding it loses content outright
          at 400% zoom and on landscape phones (WCAG 1.4.10). The hero is
          min-h, not fixed-h, so it simply grows instead. */}
      <p className="m-0 max-w-[36ch] text-[clamp(0.92rem,1.1vw,1.1rem)] text-[var(--ed-body)] leading-[1.4] [text-wrap:pretty]">
        {PROFILE.intro}
      </p>
    </div>
  </section>
);

export default Hero;
