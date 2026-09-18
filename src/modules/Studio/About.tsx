import Lines from '@Components/Lines';
import type React from 'react';
import { ABOUT_META, PROFILE } from '@/content/site';

/**
 * About.
 *
 * Deliberately the quietest band on the page: one paragraph at a readable
 * measure and two short lists. The version this replaced carried a row of
 * em-dash placeholders under a "Numbers" label — a stat row with no stats,
 * which is worse than no stat row.
 */
export default function About(): React.ReactElement {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="px-[var(--gut)] pt-[clamp(5rem,12vh,8rem)] pb-[clamp(5rem,12vh,8rem)]"
    >
      <h2 id="about-heading" className="st-meta m-0 font-[500] text-[var(--ink)]">
        about
      </h2>

      <div className="mt-[clamp(1.5rem,4vh,2.5rem)] flex flex-wrap justify-between gap-[clamp(2rem,6vw,6rem)]">
        <Lines className="st-measure m-0 text-[clamp(1.1rem,2.1vw,1.6rem)] leading-[1.42]">
          {PROFILE.bio}
        </Lines>

        <div className="flex flex-wrap gap-[clamp(1.75rem,4vw,3.5rem)]">
          {ABOUT_META.map((column) => (
            <div key={column.label}>
              <p className="st-meta m-0">{column.label}</p>
              <ul className="m-0 mt-[0.35rem] list-none p-0">
                {column.items.map((item) => (
                  <li key={item} className="text-[0.95rem] leading-[1.6]">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
