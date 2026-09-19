import type React from 'react';
import type { IconType } from 'react-icons';
import {
  FaCodepen,
  FaFacebookF,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaXTwitter
} from 'react-icons/fa6';

/**
 * A brand mark for a contact link.
 *
 * **Font Awesome 6 Brands, and the choice was forced rather than
 * preferred.** Two other sets were tried first:
 *
 * - **Simple Icons** is the better set in principle — the brands' own
 *   artwork, one solid path each — and it carries github, facebook,
 *   instagram and x. It does NOT carry linkedin or codepen: both brands
 *   asked to be removed from it. Four marks and two words in one row is
 *   not a row.
 * - **Lucide** is already a dependency and has something under every one
 *   of those six names, which is the trap. Its brand icons are deprecated
 *   outline glyphs, its `twitter` is still the bird, and its `x` is the
 *   close cross — two crossing strokes. It would have drawn a dismiss
 *   button next to a link that goes to x.com. That is a wrong answer, not
 *   a plainer one.
 *
 * Font Awesome 6 carries all six in one weight, including the real X mark.
 * The glyph-only variants are used where a brand ships both — `FaLinkedinIn`
 * over `FaLinkedin`, `FaFacebookF` over `FaFacebook` — because the other
 * four are bare glyphs and a boxed mark beside them reads as a different
 * size even when it is not.
 *
 * **Licence: the marks are CC BY 4.0** (the `react-icons` wrapper is MIT,
 * the Font Awesome Free artwork is not). Attribution belongs in the
 * colophon, which is the one place on this site that exists to say what the
 * page is made of.
 *
 * **The label decides, and an unknown label gets no icon.** The links come
 * out of the CMS, where anyone can add a row called anything — so this
 * returns null rather than guessing, and the call site falls back to
 * rendering the label as text. A link to something not in the map still
 * works; it reads as a word instead of a mark.
 */
const MARKS: Record<string, IconType> = {
  github: FaGithub,
  codepen: FaCodepen,
  linkedin: FaLinkedinIn,
  facebook: FaFacebookF,
  x: FaXTwitter,
  instagram: FaInstagram
};

/** True when there is a mark for this label. */
export const markFor = (label: string): IconType | null =>
  MARKS[label.trim().toLowerCase()] ?? null;

export default function SocialIcon({
  label,
  className
}: {
  label: string;
  className?: string;
}): React.ReactElement | null {
  const Mark = markFor(label);
  if (Mark === null) return null;

  // `aria-hidden`, and no `title`: the accessible name belongs to the link,
  // where the call site puts the label as visually hidden text. A title
  // here would make a screen reader read the brand twice.
  return <Mark aria-hidden="true" focusable="false" className={className} />;
}
