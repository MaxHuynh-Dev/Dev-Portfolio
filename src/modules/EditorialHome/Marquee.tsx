import { MARQUEE_ITEMS } from '@Modules/EditorialHome/constants';
import type React from 'react';

const track = `${MARQUEE_ITEMS.join(' ✦ ')} ✦ `;

/**
 * Two identical runs translated -50% — the standard seamless loop.
 * Decorative, so it is hidden from assistive tech entirely.
 */
export const Marquee = (): React.JSX.Element => (
  <div
    aria-hidden="true"
    className="ed-rule-t ed-rule-b relative z-[2] overflow-hidden py-[0.7rem]"
  >
    <div className="ed-label flex w-max animate-[ed-marquee_30s_linear_infinite] text-[clamp(0.66rem,1vw,0.8rem)] text-[var(--ed-muted)] tracking-[0.22em]">
      <span className="pr-8">{track}</span>
      <span className="pr-8">{track}</span>
    </div>
  </div>
);

export default Marquee;
