'use client';

import { useReveal } from '@Hooks/useReveal';
import type React from 'react';
import { type CSSProperties, useState } from 'react';

/**
 * A display line that rises out of its own mask when the page is let go.
 *
 * It goes INSIDE the heading rather than around it, and that placement is
 * the whole design. Both headings this is used on are fitted by
 * `useFittedText`, which solves against the heading's container and writes
 * the answer as `--fit-size` on the heading itself — so a wrapper would put
 * a box between the two that neither of them knows about, and the mask
 * would have no way to read the size it has to clear. Inside, it inherits
 * the solved size and `em` means what it should.
 *
 * `enabled` is how the index keeps its promise. The preloader assembles its
 * own copy of the masthead and hands it over already in place, exact to the
 * pixel; masking it would break that. On the route path there is no
 * preloader and no handover, so the heading arrives like everything else.
 * When `enabled` is false this renders the bare string and no mask exists
 * in the document at all — the markup on the load path is what it always
 * was, rather than a mask that happens to be open.
 */
export default function Headline({
  children,
  enabled = true,
  delay = 0,
  rise
}: {
  children: string;
  /** False renders the plain string, with no mask in the DOM. */
  enabled?: boolean;
  delay?: number;
  rise?: number;
}): React.ReactElement {
  const [element, setElement] = useState<HTMLSpanElement | null>(null);
  const shown = useReveal('load', element);

  if (!enabled) return <>{children}</>;

  const pose = {
    '--in-delay': `${delay}ms`,
    ...(rise === undefined ? {} : { '--in-rise': `${rise}ms` })
  } as CSSProperties;

  return (
    <span ref={setElement} className="st-mast" data-in={shown} style={pose}>
      <span className="st-mast-line">{children}</span>
    </span>
  );
}
