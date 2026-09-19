import type React from 'react';
import type { IconType } from 'react-icons';
import {
  TbBrandCodepen,
  TbBrandFacebook,
  TbBrandGithub,
  TbBrandInstagram,
  TbBrandLinkedin,
  TbBrandX
} from 'react-icons/tb';

/**
 * A brand mark for a contact link.
 *
 * **Tabler, and the LICENCE is why.** These were Font Awesome 6 Brands,
 * which draw beautifully and are **CC BY 4.0** — the `react-icons` wrapper
 * is MIT, the artwork is not. That attribution had to ship to a reader, and
 * the only place it could live was the colophon at the foot of `/about`.
 * The owner asked for that line to go. Attribution is not a line you can
 * quietly drop, so the obligation went instead: Tabler is **MIT**, covers
 * every brand here, and needs no notice anywhere.
 *
 * The trade is real and it is worth naming: these are OUTLINE marks, drawn
 * with a stroke, where Font Awesome's were solid. Lighter on the page, and
 * at 1.25rem beside 0.95rem text that reads as quieter rather than smaller.
 *
 * Two sets that were tried before either of those, and rejected:
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
 * Tabler's `TbBrandX` is the real X mark and not a close cross, which is
 * the one thing that had to be checked before trusting a second outline set
 * after Lucide.
 *
 * **The label decides, and an unknown label gets no icon.** The links come
 * out of the CMS, where anyone can add a row called anything — so this
 * returns null rather than guessing, and the call site falls back to
 * rendering the label as text. A link to something not in the map still
 * works; it reads as a word instead of a mark.
 */
const MARKS: Record<string, IconType> = {
  github: TbBrandGithub,
  codepen: TbBrandCodepen,
  linkedin: TbBrandLinkedin,
  facebook: TbBrandFacebook,
  x: TbBrandX,
  instagram: TbBrandInstagram
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
