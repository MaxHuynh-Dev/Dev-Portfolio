import { MonoLabel } from '@Components/editorial/MonoLabel';
import Image from 'next/image';
import type React from 'react';
import { cn } from '@/lib/utils';

type Props = {
  src?: string | null;
  alt: string;
  /** Caption shown in the empty state. */
  placeholder?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

/**
 * Replaces the design's <image-slot>. With a src it renders a real
 * next/image; without one it renders the design's #141414 well so the
 * layout is correct before the photography exists.
 */
export const ImageWell = ({
  src,
  alt,
  placeholder,
  className,
  sizes = '(max-width: 900px) 100vw, 50vw',
  priority = false
}: Props): React.JSX.Element => (
  <div className={cn('relative h-full w-full overflow-hidden bg-[var(--ed-well)]', className)}>
    {src ? (
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
    ) : (
      // Build scaffolding, not content: without aria-hidden this text lands
      // inside the accessible name of any link wrapping the well.
      <div aria-hidden="true" className="absolute inset-0 flex items-end p-[0.9rem]">
        <MonoLabel dim>{placeholder ?? alt}</MonoLabel>
      </div>
    )}
  </div>
);

export default ImageWell;
