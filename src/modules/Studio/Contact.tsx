import Lines from '@Components/Lines';
import Reveal from '@Components/Reveal';
import type React from 'react';
import type { LinkColumn } from '@/content/site';

/**
 * Contact.
 *
 * The email is the largest thing at the foot of the page because it is the
 * only action here. Bottom padding clears the fixed corner marks — those
 * are sized by two lines of metadata plus the gutter plus the gradient, so
 * the floor is in rem and not purely in vh; a vh-only value lets the band
 * swallow the last row on a short viewport.
 */
export default function Contact({
  email,
  links,
  colophon
}: {
  email: string;
  links: LinkColumn[];
  colophon: string;
}): React.ReactElement {
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="px-[var(--gut)] pt-[clamp(5rem,12vh,8rem)] pb-[clamp(8rem,17vh,11rem)]"
    >
      <h2 id="contact-heading" className="st-meta m-0 font-[500] text-[var(--ink)]">
        contact
      </h2>

      <div className="mt-[clamp(1.25rem,3vh,2rem)] flex flex-wrap items-end justify-between gap-[clamp(1.5rem,5vw,4rem)]">
        {/* The mask goes around the link, not inside it: a reveal must not
            come between the reader and the only action on this page. The
            leading is loosened from .st-display's 0.9 because at 0.9 the
            glyphs hang outside their own box and the mask shaves them. */}
        <Reveal className="st-line block">
          <a
            href={`mailto:${email}`}
            className="st-line-body st-display text-[clamp(1.9rem,7vw,5.2rem)] text-[var(--ink)] leading-[1.18]"
          >
            {email}
          </a>
        </Reveal>

        <div className="flex flex-wrap gap-[clamp(1.75rem,4vw,3.5rem)]">
          {links.map((column) => (
            <div key={column.label}>
              <p className="st-meta m-0">{column.label}</p>
              <ul className="m-0 mt-[0.35rem] list-none p-0">
                {column.links.map((link) => (
                  <li key={link.label} className="text-[0.95rem] leading-[1.6]">
                    <a
                      className="st-link"
                      href={link.href}
                      rel="noreferrer noopener"
                      target="_blank"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <Lines className="st-measure st-meta mt-[clamp(3rem,9vh,6rem)] mb-0">{colophon}</Lines>
    </section>
  );
}
