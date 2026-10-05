'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** The probe is measured at this size and the result scaled. */
const PROBE_PX = 100;

export interface FitOptions {
  /** Cap the result at this fraction of the viewport height. */
  maxViewportFraction?: number;
  /** Line-height multiplier, used only with maxViewportFraction. */
  lineHeight?: number;
  maxPx?: number;
  minPx?: number;
}

export interface Fitted {
  ref: React.RefObject<HTMLElement | null>;
  /** The size actually applied, in px. Studies display this. */
  size: number;
  /** The container's content-box width the size was solved against. */
  available: number;
}

/**
 * Sizes a single nowrap line to exactly fill its container.
 *
 * Three things make this harder than it looks, and each one produced a
 * confidently wrong result in this repo before it was fixed:
 *
 * 1. **A per-character coefficient does not exist.** In a display face at
 *    display tracking, `IIII` measures about 0.35em per character and
 *    `MMMM` about 0.85em — a 2.4x spread. Any `chars x ratio` formula is
 *    wrong for most strings. So this measures the real string.
 *
 * 2. **Measure the container's content box, never the element's own.** The
 *    fitted element is `white-space: nowrap`, so when the text is wider
 *    than the column its box grows to the text and the next fit reads its
 *    own previous output. That fed back as 131px, then 185px, then 242px
 *    from identical input.
 *
 * 3. **Measure on a detached probe.** An earlier version set
 *    `width: max-content` on the element itself, which mutates the node the
 *    ResizeObserver watches; the component's refit then raced the
 *    measurement and the probe size silently failed to apply.
 *
 * The element reads the result as `var(--fit-size)`.
 */
export function useFittedText(text: string, options: FitOptions = {}): Fitted {
  const {
    maxViewportFraction,
    lineHeight = 0.9,
    maxPx = Number.POSITIVE_INFINITY,
    minPx = 10
  } = options;

  const ref = useRef<HTMLElement | null>(null);
  const [state, setState] = useState<{ size: number; available: number }>({
    size: 0,
    available: 0
  });

  const solve = useCallback((): void => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const parentStyle = getComputedStyle(parent);
    const available =
      parent.clientWidth -
      parseFloat(parentStyle.paddingLeft) -
      parseFloat(parentStyle.paddingRight);
    if (available <= 0) return;

    const style = getComputedStyle(el);
    const currentPx = parseFloat(style.fontSize) || PROBE_PX;

    const probe = document.createElement('span');
    probe.textContent = text;
    probe.style.position = 'absolute';
    probe.style.left = '-99999px';
    probe.style.top = '0';
    probe.style.whiteSpace = 'pre';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.style.fontFamily = style.fontFamily;
    probe.style.fontWeight = style.fontWeight;
    probe.style.fontStyle = style.fontStyle;
    probe.style.fontSize = `${PROBE_PX}px`;
    // letter-spacing computes to px against the element's CURRENT size, so
    // carrying the px value onto a 100px probe would apply the wrong
    // tracking. Re-express it as a ratio first.
    probe.style.letterSpacing =
      style.letterSpacing === 'normal'
        ? 'normal'
        : `${parseFloat(style.letterSpacing) / currentPx}em`;
    // Word spacing too, and for the same reason. The site never sets it,
    // but a reader's text-spacing override (WCAG 1.4.12) does — 0.16em — and
    // a probe without it fitted a two-word name 35px wider than its column.
    const wordSpacing = parseFloat(style.wordSpacing);
    probe.style.wordSpacing =
      Number.isFinite(wordSpacing) && wordSpacing !== 0 ? `${wordSpacing / currentPx}em` : 'normal';

    document.body.appendChild(probe);
    const natural = probe.getBoundingClientRect().width;
    probe.remove();
    if (natural <= 0) return;

    let next = available / (natural / PROBE_PX);
    if (maxViewportFraction !== undefined) {
      next = Math.min(next, (window.innerHeight * maxViewportFraction) / lineHeight);
    }
    next = Math.floor(Math.max(minPx, Math.min(next, maxPx)));

    // Always written, never skipped as redundant. The whole hero once
    // rendered at exactly the probe size because a "nothing changed" guard
    // returned before this line.
    el.style.setProperty('--fit-size', `${next}px`);
    setState((prev) =>
      prev.size === next && prev.available === available ? prev : { size: next, available }
    );
  }, [text, maxViewportFraction, lineHeight, maxPx, minPx]);

  useEffect(() => {
    solve();

    const parent = ref.current?.parentElement;
    if (!parent) return;

    // Width only. The observed box's HEIGHT changes as a direct result of
    // the font-size this callback writes, so reacting to height would be a
    // feedback loop that never settles.
    let lastWidth = -1;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? -1;
      if (width === lastWidth) return;
      lastWidth = width;
      solve();
    });
    observer.observe(parent);

    // Webfont swap changes every measurement on the page.
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) solve();
    });

    // Two things the width observer cannot see, refitted on the next frame.
    let frame = 0;
    const refit = (): void => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(solve);
    };

    // A HEIGHT-only resize, when the size is capped by the viewport's height
    // (`maxViewportFraction`): a phone turned on its side, devtools docked
    // along the bottom. The cap reads `innerHeight`, which nothing this hook
    // writes can change, so — unlike the observed box's height — it cannot
    // feed back into a loop.
    let lastHeight = window.innerHeight;
    const onResize = (): void => {
      if (maxViewportFraction === undefined || window.innerHeight === lastHeight) return;
      lastHeight = window.innerHeight;
      refit();
    };
    window.addEventListener('resize', onResize);

    // A stylesheet arriving after the fit — what a reader's text-spacing
    // override (WCAG 1.4.12) or a user-style extension does. It widens the
    // tracking without widening the column, so the fitted line overran its
    // mask and was clipped: 274px of a project's name lost at 1440. Only
    // <style> and <link> insertions in <head> (or straight on <html>, where
    // some extensions put them) count. Next adds a stylesheet link on some
    // route changes too; the refit that costs is one idempotent measurement.
    const sheets = new MutationObserver((records) => {
      const added = records.some((record) =>
        Array.from(record.addedNodes).some(
          (node) => node.nodeName === 'STYLE' || node.nodeName === 'LINK'
        )
      );
      if (added) refit();
    });
    sheets.observe(document.head, { childList: true });
    sheets.observe(document.documentElement, { childList: true });

    return () => {
      cancelled = true;
      observer.disconnect();
      sheets.disconnect();
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
    };
  }, [solve, maxViewportFraction]);

  return { ref, size: state.size, available: state.available };
}
