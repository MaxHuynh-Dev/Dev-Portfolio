import type React from 'react';
import type { PropsWithChildren } from 'react';
import { cn } from '@/lib/utils';

type Props = PropsWithChildren & {
  id?: string;
  className?: string;
  /** Dim grey — the design's label-caption colour. */
  dim?: boolean;
  /** Wider tracking, used for section headers. */
  wide?: boolean;
  as?: React.ElementType;
};

/**
 * The uppercase mono label that carries every piece of metadata in the
 * design — section headers, column captions, years, categories.
 */
export const MonoLabel = ({
  children,
  id,
  className,
  dim = false,
  wide = false,
  as: Tag = 'span'
}: Props): React.JSX.Element => (
  <Tag
    id={id}
    className={cn('ed-label', wide && 'ed-label-wide', dim && 'text-[var(--ed-muted)]', className)}
  >
    {children}
  </Tag>
);

export default MonoLabel;
