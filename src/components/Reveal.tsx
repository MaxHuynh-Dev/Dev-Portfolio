'use client';

import { type Trigger, useReveal } from '@Hooks/useReveal';
import type React from 'react';
import { type CSSProperties, useState } from 'react';

/**
 * A mask that comes up when the block is asked for.
 *
 * `Lines` is for running prose, where the breaks have to be measured. This
 * is for what is already one line — a heading, an address, a row of
 * metadata — where the mask is the element's own box and the call site
 * supplies the `.st-line` / `.st-line-body` pair itself.
 *
 * It renders a span and nothing else, so it can sit inside a paragraph or a
 * flex row without changing what is around it.
 */
export default function Reveal({
  children,
  className,
  on = 'scroll',
  delay = 0,
  rise
}: {
  children: React.ReactNode;
  className?: string;
  on?: Trigger;
  /** Held before this one comes up, in ms. Staggering a group lives here. */
  delay?: number;
  /** How long it takes to clear its mask. Defaults to the primitive's own. */
  rise?: number;
}): React.ReactElement {
  const [element, setElement] = useState<HTMLSpanElement | null>(null);
  const shown = useReveal(on, element);

  // Custom properties, not `transitionDelay`. This component owns the MASK
  // and the call site owns the line inside it, so a delay written here
  // would land on the wrong element — transition-delay does not inherit and
  // the mask has no transition of its own to delay. It used to be written
  // exactly that way, and did nothing at all. Custom properties do inherit,
  // so `.st-line-body` and `.st-mast-line` read them wherever they sit.
  const pose = {
    '--in-delay': `${delay}ms`,
    ...(rise === undefined ? {} : { '--in-rise': `${rise}ms` })
  } as CSSProperties;

  return (
    <span ref={setElement} className={className} data-in={shown} style={pose}>
      {children}
    </span>
  );
}
