import type React from 'react';

import About from './About';
import Contact from './Contact';
import Open from './Open';
import Work from './Work';

/**
 * The page.
 *
 * A server component composing four bands. There is no client boundary
 * wrapping the whole page and no scroll-reveal machinery: content arrives
 * already placed. The only client leaves are the ones that genuinely own
 * state — the opening's fitting engine, the work list's focus tracking,
 * the corner marks' clock, and the studies themselves.
 */
export default function Studio(): React.ReactElement {
  return (
    <>
      <Open />
      <Work />
      <About />
      <Contact />
    </>
  );
}
