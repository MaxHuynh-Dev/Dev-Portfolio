import Link from 'next/link';
import type React from 'react';

/**
 * The 404, in the site's own grammar rather than Next's unstyled default:
 * a statement in display type standing on the foot of the screen, the way
 * the index's block does (trap 41), and the two ways back as words.
 *
 * Static on purpose. It has no masks and no arrival: a reader who has just
 * followed a dead link should see where they are at once, not watch it.
 *
 * Rendered twice. `app/(frontend)/not-found.tsx` puts it inside the site's
 * layout — corner marks, fonts, both curtains — for a `notFound()` thrown by
 * a page, which is every unknown project slug. `app/global-not-found.tsx`
 * wraps it in a document of its own for a URL that matches no route at all,
 * because this app has two root layouts and so no single one to fall back to.
 *
 * Every internal link carries `data-transition-label` (trap 42): without it
 * the route curtain rises with nothing on it.
 */
export default function NotFoundView(): React.ReactElement {
  return (
    <section
      aria-labelledby="not-found-heading"
      className="flex min-h-[100svh] flex-col px-[var(--gut)] pt-[clamp(7rem,13vh,9.5rem)] pb-[clamp(7rem,13vh,9.5rem)]"
    >
      <h1
        id="not-found-heading"
        className="st-display mt-auto mb-0 max-w-[16ch] text-[clamp(2.4rem,8vw,7rem)] text-[var(--ink)]"
      >
        Nothing lives at this address.
      </h1>
      <p className="mt-[clamp(1.2rem,3vh,2rem)] mb-0 max-w-[46ch] text-[clamp(1rem,1.6vw,1.2rem)] leading-[1.45]">
        The link may be old, or the page may have moved.{' '}
        <Link className="st-link text-[var(--ink)]" href="/works" data-transition-label="work">
          See the work
        </Link>
        , or go{' '}
        <Link className="st-link text-[var(--ink)]" href="/" data-transition-label="Max Huynh">
          back to the start
        </Link>
        .
      </p>
    </section>
  );
}
