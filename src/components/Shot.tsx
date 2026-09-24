import Image from 'next/image';
import type React from 'react';
import type { Size } from '@/content/site';

export interface ShotProps {
  src: string | null;
  /** What the image shows. Ignored when src is null — see below. */
  alt: string;
  /** CSS aspect-ratio, e.g. '16 / 10'. The shape to crop to, or to reserve. */
  ratio: string;
  /** Printed on the empty field. Say what belongs here, and at what shape. */
  label: string;
  /** next/image sizes hint. */
  sizes: string;
  priority?: boolean;
  /**
   * The file's own dimensions, as recorded by the CMS on upload.
   *
   * With them the image is laid out at its own shape — full width, height
   * auto — and nothing is cropped. Without them it is cropped to `ratio`,
   * which is the right answer for a fixed slot: the index's preview aside
   * and the ring's covers are designed boxes, and a stack of covers that
   * were each a different height would not be a ring.
   */
  size?: Size | null;
  /**
   * Fill the parent's height instead of reserving `ratio`.
   *
   * For a box whose height is set by something ELSE — `/about`'s portrait
   * column, which is stretched to the height of the prose beside it so the
   * two bottom edges are one line. A ratio cannot express "as tall as that
   * column", and a width tuned until it looked level would be a number
   * kept in step by hand (trap 11) against a column that reflows with the
   * content in it.
   *
   * It makes this a SLOT, so `size` is ignored and a real photograph is
   * cropped into the box with `object-cover`. That is the designed-box case
   * trap 27 already names — which of the two is right is a property of the
   * place, not of the image, and a column measured against its neighbour is
   * a place.
   */
  stretch?: boolean;
  /**
   * Fetch now, wherever the image sits, instead of when it nears the
   * viewport. For a picture the route curtain waits for that is not on
   * screen at rest — the ring's covers, which all cross the screen as it
   * arrives. A lazy image off to the side is one the browser may not have
   * asked for yet, and a wait on it would simply run to the cap.
   */
  eager?: boolean;
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
 *
 * Two ways of sizing a real image, and which one is right is a property of
 * the place it is going, not of the image:
 *
 * - **Its own shape** (`size` given). The picture is the content, so the
 *   box is the picture's. `width`/`height` are the intrinsic pixels, which
 *   is not the rendered size — it is how the browser reserves the right
 *   height before a byte of the file has arrived. That reservation is the
 *   whole reason the size is measured on the server rather than read off
 *   the loaded image.
 * - **A declared shape** (`size` omitted). The box is the content — a slot
 *   in a layout that has to hold still whatever is dropped into it — and
 *   the image is cropped to fill it.
 */
export default function Shot({
  src,
  alt,
  ratio,
  label,
  sizes,
  priority = false,
  size = null,
  stretch = false,
  eager = false
}: ShotProps): React.ReactElement {
  const loading = eager ? 'eager' : undefined;

  if (src !== null && size !== null && !stretch) {
    return (
      <Image
        src={src}
        alt={alt}
        width={size.width}
        height={size.height}
        sizes={sizes}
        priority={priority}
        loading={loading}
        className="block h-auto w-full"
      />
    );
  }

  return (
    <div
      className={stretch ? 'relative h-full w-full' : 'relative w-full'}
      style={stretch ? undefined : { aspectRatio: ratio }}
    >
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
          loading={loading}
          className="object-cover"
        />
      )}
    </div>
  );
}
