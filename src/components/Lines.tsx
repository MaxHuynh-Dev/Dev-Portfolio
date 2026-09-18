'use client';

import { type Trigger, useReveal } from '@Hooks/useReveal';
import type React from 'react';
import { useEffect, useState } from 'react';

/**
 * A block of text, split into its own lines and masked.
 *
 * The lines are measured, not guessed — there is no way to know where a
 * paragraph breaks without laying it out first. The measuring is done with
 * a `Range` over the element's own text node, one word at a time, reading
 * which line box each word landed in. **Nothing is added to the DOM to take
 * that measurement**, and that is the whole point.
 *
 * The first version wrapped every word in a span and read the spans. It
 * never settled. These paragraphs sit in places where the element's width
 * follows its content — a flex item in `About`, an `ml-auto` block in
 * `Open` — so splitting changed the width, the ResizeObserver watching for
 * a width change fired, the split was thrown away, and the block oscillated
 * forever between the two poses. That is `useFittedText`'s trap exactly:
 * the observed box changes as a direct result of what the callback writes.
 * Two answers came out of it, and both are kept here: measure without
 * writing, and watch the PARENT, whose width does not depend on this
 * element's pose.
 *
 * Two poses, both real renders:
 *
 * - `plain` — one text node. What the server sends, what hydration matches,
 *   what a reader with no JavaScript keeps, and what every measurement is
 *   taken against.
 * - `lines` — the masked pose the reveal happens in.
 *
 * The text is identical in both, so nothing here changes what a screen
 * reader reads or what a search engine indexes. It is the same string,
 * wrapped differently.
 */

/** How long one line takes to clear its mask. */
const RISE_MS = 620;

/** And the gap between one line and the next. */
const STAGGER_MS = 70;

/** Two word-tops within this many pixels are on the same line. */
const SAME_LINE = 2;

interface Props {
  children: string;
  /** Goes on the element itself, exactly as it would without this wrapper. */
  className?: string;
  /**
   * `load` plays as soon as the page is let go — which means *after* the
   * entry curtain has finished, not behind it. `scroll` waits until the
   * block has come into view.
   */
  on?: Trigger;
  /** Held before the first line, in ms. */
  delay?: number;
  as?: 'p' | 'h2' | 'div';
}

interface Line {
  text: string;
  key: string;
  at: number;
}

/** Where this paragraph's lines actually break, read off the real layout. */
const readLines = (element: HTMLElement): Line[] | null => {
  const node = element.firstChild;
  if (node === null || node.nodeType !== Node.TEXT_NODE) return null;
  const text = node.textContent ?? '';
  if (text.trim() === '') return null;

  // A Range's rect is whatever the last layout said — it does not flush one
  // of its own. Every reading below would otherwise be a frame stale.
  void element.getBoundingClientRect();

  const range = document.createRange();
  const rows: string[] = [];
  const words = /\S+/g;
  let match: RegExpExecArray | null = words.exec(text);
  let top: number | null = null;
  let from = 0;
  let to = 0;

  while (match !== null) {
    range.setStart(node, match.index);
    range.setEnd(node, match.index + match[0].length);
    const at = range.getBoundingClientRect().top;

    if (top === null) {
      top = at;
      from = match.index;
    } else if (Math.abs(at - top) > SAME_LINE) {
      rows.push(text.slice(from, to).trim());
      from = match.index;
      top = at;
    }

    to = match.index + match[0].length;
    match = words.exec(text);
  }
  if (top === null) return null;
  rows.push(text.slice(from).trim());

  return rows.map((line, index) => ({ text: line, key: `${index}-${line}`, at: index }));
};

export default function Lines({
  children,
  className,
  on = 'scroll',
  delay = 0,
  as: Tag = 'p'
}: Props): React.ReactElement {
  const [element, setElement] = useState<HTMLParagraphElement | null>(null);
  const [lines, setLines] = useState<Line[] | null>(null);
  /**
   * Bumped every time the split has to be taken again.
   *
   * It exists because `lines` cannot be both the answer and the request for
   * one. Invalidating by setting `lines` back to null loses the request
   * whenever the reset lands in the same batch as the split that preceded
   * it: React collapses rows-then-null to no change at all, the effect's
   * dependencies never move, and the block sits in its plain pose forever.
   * Measured exactly that way — the split ran once per paragraph and the
   * three resets that followed re-ran nothing.
   */
  const [pass, setPass] = useState(0);
  /**
   * Whether the masked pose has been PAINTED at least once.
   *
   * A transition needs a value to come from. `Reveal` and `Headline` render
   * their line on the very first commit, parked, so there always is one —
   * but this component cannot: it has to measure where the paragraph breaks
   * before it can split it, so the `.st-line-body` spans do not exist until
   * a later commit. If the page has already been let go by then, those
   * spans are INSERTED with the ancestor already at `data-in="true"`, and a
   * newly inserted element's first computed style is simply `transform:
   * none`. There is nothing to transition from, so nothing transitions.
   *
   * Measured on the paths where that happens — a browser Back, which raises
   * no curtain at all, and any navigation slower than the route curtain's
   * 3s cap, which in `next dev` is an ordinary on-demand compile: **one**
   * distinct transform across 264 frames. The text simply appeared.
   *
   * So the split's first commit is always parked, and the reveal is allowed
   * one frame later, by which time the browser has a previous value.
   */
  const [painted, setPainted] = useState(false);
  const asked = useReveal(on, element);

  // `pass` is the request for a split, not an input to one, so the body has
  // no reason to read it — and dropping it, which is what the rule asks
  // for, is exactly the bug the counter above was added to fix.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pass is the request for a re-split, not an input to one
  useEffect(() => {
    if (element === null) return;
    // Only ever measured against the plain pose. If the masks are still in
    // the DOM there is no text node to range over, and leaving the previous
    // answer alone is better than replacing it with nothing.
    const read = readLines(element);
    if (read !== null) setLines(read);
  }, [element, pass]);

  // A new paragraph is a new measurement. The split's own effect cannot
  // take `children` as a dependency — it has to run against the PLAIN pose,
  // and by the time it re-ran the masks would still be in the DOM with no
  // text node to range over. So the content change asks for a split the
  // same way a width change does: back to plain, then bump the counter.
  //
  // Today this is belt and braces on the route path — Next keys each
  // dynamic segment by its param value, so `/work/hylix` to `/work/soluis`
  // remounts the whole subtree rather than reusing it. It is not belt and
  // braces in development, where Fast Refresh preserves state and a paragraph
  // edited in `site.ts` would otherwise keep rendering the old lines.
  // biome-ignore lint/correctness/useExhaustiveDependencies: children is the trigger for a re-split, not a value the effect reads
  useEffect(() => {
    setLines(null);
    setPass((previous) => previous + 1);
  }, [children]);

  useEffect(() => {
    if (lines === null) {
      setPainted(false);
      return;
    }
    // One frame, not a microtask: the parked pose has to have been through
    // a real style recalculation, and `Promise.resolve()` would run inside
    // the same one.
    const frame = requestAnimationFrame(() => {
      setPainted(true);
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [lines]);

  // The parent, not this element: this one's width follows its own content
  // at several of the call sites, so observing it would be observing the
  // split's own effect and the block would never settle.
  useEffect(() => {
    if (element === null) return;
    const parent = element.parentElement;
    if (parent === null) return;

    // Content box, to match what the observer reports. Taking the border
    // box here instead made the very first callback look like a 93px change
    // on a section that had not moved at all — it was the gutter.
    let width = parent.clientWidth;
    const again = (): void => {
      // Back to plain first, so the next pass has a text node to range
      // over, and bump the pass so that pass is what asks for the split.
      setLines(null);
      setPass((previous) => previous + 1);
    };

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? width;
      if (Math.abs(next - width) < 1) return;
      width = next;
      again();
    });
    observer.observe(parent);
    // The text face lands after first paint and re-breaks every paragraph.
    void document.fonts.ready.then(again);

    return () => {
      observer.disconnect();
    };
  }, [element]);

  return (
    <Tag
      ref={setElement}
      className={className}
      data-in={lines === null ? undefined : painted && asked}
    >
      {lines === null
        ? children
        : lines.map((line) => (
            <span key={line.key} className="st-line">
              <span
                className="st-line-body"
                style={{
                  transitionDuration: `${RISE_MS}ms`,
                  transitionDelay: `${delay + line.at * STAGGER_MS}ms`
                }}
              >
                {line.text}
                {/* The break between two lines is a space in the original
                    string, and a block per line throws it away: the text
                    concatenated back came out as "I build it tohold up."
                    A trailing space is collapsed away visually at the end
                    of a block, so it costs the layout nothing and gives a
                    screen reader — and anyone copying the paragraph — the
                    sentence it started as. */}
                {line.at < lines.length - 1 ? ' ' : ''}
              </span>
            </span>
          ))}
    </Tag>
  );
}
