'use client';

import { type Trigger, useReveal } from '@Hooks/useReveal';
import type React from 'react';
import { useState } from 'react';

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
  delay = 0
}: {
  children: React.ReactNode;
  className?: string;
  on?: Trigger;
  delay?: number;
}): React.ReactElement {
  const [element, setElement] = useState<HTMLSpanElement | null>(null);
  const shown = useReveal(on, element);

  return (
    <span
      ref={setElement}
      className={className}
      data-in={shown}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </span>
  );
}
