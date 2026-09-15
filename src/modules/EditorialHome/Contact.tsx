import { MonoLabel } from '@Components/editorial/MonoLabel';
import { CONTACT_LINKS, PROFILE } from '@Modules/EditorialHome/constants';
import type React from 'react';

/** The closing statement. This section is the footer — there is no other. */
export const Contact = (): React.JSX.Element => (
  <section
    id="contact"
    aria-labelledby="contact-head"
    className="ed-rule-t relative z-[2] px-[var(--gut)] pt-[clamp(3rem,7vw,6rem)] pb-[clamp(6rem,12vh,8rem)]"
  >
    <h2
      id="contact-head"
      className="ed-reveal ed-display m-0 mb-[clamp(1.75rem,4vw,3rem)] text-[clamp(2.6rem,11vw,10rem)] leading-[0.9] tracking-[-0.04em]"
    >
      Come say hi
    </h2>

    <div className="ed-reveal ed-rule-t grid gap-[clamp(1.25rem,3vw,2.5rem)] pt-[1.2rem] [grid-template-columns:repeat(auto-fit,minmax(min(100%,13rem),1fr))]">
      <div className="flex flex-col gap-[0.5rem]">
        <MonoLabel dim>Drop me a line</MonoLabel>
        <a
          href={`mailto:${PROFILE.email}`}
          className="ed-label normal-case tracking-[0.06em] transition-colors duration-200 hover:text-[var(--ed-accent)]"
        >
          {PROFILE.email}
        </a>
      </div>

      {CONTACT_LINKS.map((column) => (
        <div key={column.label} className="flex flex-col gap-[0.5rem]">
          <MonoLabel dim>{column.label}</MonoLabel>
          {column.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="ed-label transition-colors duration-200 hover:text-[var(--ed-accent)]"
            >
              {link.label}
            </a>
          ))}
        </div>
      ))}

      <div className="flex flex-col gap-[0.5rem]">
        <MonoLabel dim>Availability</MonoLabel>
        <MonoLabel>{PROFILE.availabilityDetail}</MonoLabel>
      </div>
    </div>
  </section>
);

export default Contact;
