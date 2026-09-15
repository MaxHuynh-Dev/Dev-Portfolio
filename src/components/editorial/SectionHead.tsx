import { MonoLabel } from '@Components/editorial/MonoLabel';
import type React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  label: string;
  /** Lets the owning <section> reference this heading via aria-labelledby. */
  headingId?: string;
  /** Right-hand side: a year range, a count. */
  meta?: React.ReactNode;
  /** The design rules some heads below and leaves others open. */
  ruled?: boolean;
  className?: string;
};

/** Label left, meta right, optional hairline under — repeats at every section. */
export const SectionHead = ({
  label,
  headingId,
  meta,
  ruled = true,
  className
}: Props): React.JSX.Element => (
  <div
    className={cn(
      'flex items-baseline justify-between gap-4 pb-[0.8rem]',
      ruled && 'ed-rule-b',
      className
    )}
  >
    {/* A real heading, not a styled span — otherwise the project titles
        below are h3s under no h2 and the outline jumps h1 -> h3. */}
    <MonoLabel as="h2" id={headingId} wide dim className="m-0 font-normal">
      {label}
    </MonoLabel>
    {meta ? (
      <MonoLabel wide dim>
        {meta}
      </MonoLabel>
    ) : null}
  </div>
);

export default SectionHead;
