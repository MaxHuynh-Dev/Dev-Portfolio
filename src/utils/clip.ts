/**
 * Text helpers with no dependencies, so they can be unit-tested without
 * loading the CMS.
 */

/** Past this, Google cuts a description off mid-word in the result. */
const DESCRIPTION_MAX = 160;

/**
 * A description that fits a search result: whitespace collapsed, and cut at
 * the last word that fits rather than mid-word. The copy is the CMS's, so the
 * length is not something any one page can promise.
 */
export function clip(text: string, max = DESCRIPTION_MAX): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max - 1);
  // When the cut already ends on a whole word, keep it: backing up to the
  // space before it dropped a word that fitted.
  const end = flat[max - 1] === ' ' ? cut.length : cut.lastIndexOf(' ');
  return `${cut.slice(0, end).replace(/[\s,;:.—–-]+$/, '')}…`;
}
