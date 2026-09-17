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

  const fit = useCallback((): void => {
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
    fit();

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
      fit();
    });
    observer.observe(parent);

    // Webfont swap changes every measurement on the page.
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) fit();
    });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [fit]);

  return { ref, size: state.size, available: state.available };
}
