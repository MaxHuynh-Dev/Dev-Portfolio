'use client';

import { type Trigger, useReveal } from '@Hooks/useReveal';
import type React from 'react';
import { type CSSProperties, useState } from 'react';

/** Three turns of 0–9. The strip is this many cells tall. */
const CELLS = 30;

/** Between one digit starting and the next. */
const STEP_MS = 70;

/**
 * A number that counts itself into place, one wheel per digit.
 *
 * Every digit is a strip of 0–9 three times over, in a window one line
 * tall, parked one cell BELOW the window so nothing shows until it is asked
 * for. On reveal each strip rolls up to its own digit — and the further
 * right a digit sits, the more turns it takes to get there: the first digit
 * of `2023` travels two cells, the last travels twenty-three. All of them
 * take the same time, so the low digits spin and the high ones barely move,
 * which is how a counter actually behaves and what makes it read as
 * counting rather than as four masks rising.
 *
 * It is the site's mask idiom and not a new one: the direction is up, the
 * clip is a line box, the curve is `.st-line-body`'s, and the whole thing
 * is one CSS transition keyed off `data-in` — so the reduced-motion block
 * flattens it to 0.01ms and the number simply arrives, without this file
 * asking.
 *
 * The strips are `aria-hidden`; the real number is a screen-reader-only
 * string beside them, so it is read once and copies as itself.
 */
export default function Odometer({
  value,
  on = 'scroll',
  delay = 0
}: {
  value: string;
  on?: Trigger;
  delay?: number;
}): React.ReactElement {
  const [element, setElement] = useState<HTMLSpanElement | null>(null);
  const shown = useReveal(on, element);

  // Built outside the JSX so no key is an array index. Digits only turn;
  // anything else in the string is set as it is.
  let wheel = 0;
  const chars = [...value].map((char, position) => {
    const digit = /\d/.test(char) ? Number(char) : null;
    const turns = digit === null ? 0 : Math.min(wheel++, 2);
    return { id: `${position}:${char}`, char, digit, turns };
  });

  return (
    <span ref={setElement} className="st-odo" data-in={shown}>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="st-odo-row">
        {chars.map(({ id, char, digit, turns }, order) =>
          digit === null ? (
            <span key={id}>{char}</span>
          ) : (
            <span
              key={id}
              className="st-odo-cell"
              style={
                {
                  '--odo-to': digit + turns * 10,
                  '--odo-delay': `${delay + order * STEP_MS}ms`
                } as CSSProperties
              }
            >
              {/* Sizes the window to the digit it lands on. */}
              <span className="invisible">{char}</span>
              <span className="st-odo-strip">
                {Array.from({ length: CELLS }, (_, cell) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: a fixed strip of 30 cells that never reorders
                  <span key={cell}>{cell % 10}</span>
                ))}
              </span>
            </span>
          )
        )}
      </span>
    </span>
  );
}
