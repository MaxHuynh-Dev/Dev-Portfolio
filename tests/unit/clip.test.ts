import { clip } from '@Utils/clip';
import { describe, expect, it } from 'vitest';

describe('clip — a meta description that fits a search result', () => {
  it('leaves a short text alone, whitespace collapsed', () => {
    expect(clip('  I build   the\ninteractive half.  ')).toBe('I build the interactive half.');
  });

  it('cuts at the last whole word and ends on an ellipsis', () => {
    const out = clip('one two three four five', 14);
    expect(out).toBe('one two three…');
    expect(out.length).toBeLessThanOrEqual(14);
  });

  it('never leaves punctuation hanging before the ellipsis', () => {
    expect(clip('paper, ink, type, grid', 13)).toBe('paper, ink…');
  });

  it('defaults to 160 characters', () => {
    const out = clip('word '.repeat(80));
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith('…')).toBe(true);
  });
});
