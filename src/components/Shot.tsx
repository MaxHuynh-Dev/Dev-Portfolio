import Image from 'next/image';
import type React from 'react';

export interface ShotProps {
  src: string | null;
  /** What the image shows. Ignored when src is null — see below. */
  alt: string;
  /** CSS aspect-ratio, e.g. '16 / 10'. */
  ratio: string;
  /** Printed on the empty field. Say what belongs here, and at what shape. */
  label: string;
  /** next/image sizes hint. */
  sizes: string;
  priority?: boolean;
}

/**
 * One piece of project imagery, or the field where it will go.
 *
 * `src: null` is not a broken state and must not look like one. It renders
 * a sized, labelled field so the page's rhythm, its scroll length and its
 * thumbnail rail are all correct before a single screenshot exists — and
 * the label says exactly what to drop in.
 *
 * The empty field is `aria-hidden`: there is no image, so there is nothing
 * to describe, and an alt-like string here would put "TODO" into the
 * accessible name of whatever contains it. That is the same trap the old
 * ImageWell hit, where a placeholder caption leaked into a link's name.
 */
export default function Shot({
  src,
  alt,
  ratio,
  label,
  sizes,
  priority = false
}: ShotProps): React.ReactElement {
  return (
    <div className="relative w-full" style={{ aspectRatio: ratio }}>
      {src === null ? (
        <div aria-hidden="true" className="absolute inset-0 bg-[var(--well)]">
          <span className="st-meta absolute bottom-[0.6rem] left-[0.75rem] text-[var(--ink)]">
            {label}
          </span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      )}
    </div>
  );
}
