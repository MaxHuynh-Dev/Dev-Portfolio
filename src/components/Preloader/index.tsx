"use client";

import gsap from "gsap";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { PRELOADING_ATTR } from "./boot";

/** The curtain holds at least this long so it reads as a deliberate
 *  gesture. The page is prerendered and small; on a warm cache every real
 *  signal resolves in well under 300ms, which would only ever flash. */
const MIN_HOLD_MS = 1200;

/** Absolute ceiling. Nothing justifies holding a reader behind a curtain
 *  longer than this, including a webfont that never arrives. */
const HARD_CAP_MS = 6000;

/** Fallback if the token in global.css is renamed out from under us. */
const FALLBACK_DISSOLVE = 620;

/** One letter's travel into place. */
const LETTER_MS = 700;

/** And between one letter and the next — squeezed if the name is long, so
 *  a fifteen-letter name does not hold the reader twice as long as a
 *  nine-letter one. */
const STAGGER_MS = 70;
const MAX_SPREAD_MS = 560;

/**
 * How far out of the line a letter waits, as a percentage of its own box.
 *
 * Not a taste value. A letter has to clear the mask, which is the line box
 * (0.9em, from `.st-display`) plus the measured overhang, so it must travel
 * 0.9em + pad while 100% of its own box is only 0.9em. 150% covers any pad
 * up to 0.45em; the worst string measured here needed 0.18em, and a name
 * with no descenders needs almost nothing. Anything less than about 130%
 * and the tail of a letter sits visible on the paper waiting for its turn.
 */
const DROP_PERCENT = 150;

/** If the browser will not report font metrics, how far the ink is assumed
 *  to overhang the line box at each end. */
const FALLBACK_OVERHANG = 0.12;

/** The probe is measured at this size and the result scaled. */
const PROBE_PX = 100;

const readMs = (name: string, fallback: number): number => {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  if (raw.endsWith("ms")) return parseFloat(raw) || fallback;
  if (raw.endsWith("s")) return (parseFloat(raw) || fallback / 1000) * 1000;
  return fallback;
};

/**
 * The width of an element's text, not of the block it sits in. A block
 * heading's own rect is the column; only a range over its contents says
 * where the letters actually end.
 *
 * The first line is not redundant. `Element.getBoundingClientRect()`
 * flushes pending style and layout; the Range version does not, and
 * returns whatever the last layout said. Read in the same turn as a style
 * write — which is every call here — it is one frame stale, and a
 * correction solved against a stale measurement and then checked against
 * another one oscillated for 400ms and settled 70px short. It also reads
 * a heading mid-webfont-swap as still being in the fallback face, which
 * looks exactly like `document.fonts.ready` having resolved too early.
 */
const textWidth = (el: HTMLElement): number => {
  void el.getBoundingClientRect();
  const range = document.createRange();
  range.selectNodeContents(el);
  return range.getBoundingClientRect().width;
};

/**
 * Whether this page load gets a curtain, snapshotted at module evaluation —
 * which happens once per document, and always after the blocking head
 * script has run. On the client that is now always true; the constant earns
 * its keep by being false during server render, and by being a *snapshot*.
 *
 * Reading the attribute inside the effect instead is self-defeating:
 * StrictMode invokes effects twice in development, and the first pass's
 * cleanup releases the attribute, so the second pass would find nothing to
 * do and unmount the curtain for good. A Fast Refresh remount does the
 * same. The effect re-asserts ownership below rather than trusting what it
 * finds.
 */
const shouldRun =
  typeof document !== "undefined" &&
  document.documentElement.hasAttribute(PRELOADING_ATTR);

interface Geometry {
  /** Left edge of the column, in viewport px. */
  left: number;
  /** Where the line's own box has to start, so it lands on the masthead. */
  top: number;
  /** The font-size the masthead solved to. */
  size: number;
  /** And how wide its letters actually run at that size. Zero on a page
   *  with no masthead, where there is nothing to match. */
  run: number;
}

/**
 * The curtain.
 *
 * A sheet of paper, and the name assembling itself on it: every letter
 * waits just outside the line — odd ones above, even ones below — and
 * slides into place left to right, 70ms apart, out of a mask.
 *
 * Nothing flies anywhere afterwards. The line is built at the masthead's
 * own size, tracking and position, read off the real `<h1>` rather than
 * guessed, so when the paper dissolves the line underneath is already the
 * one that was there. Two earlier versions did this differently and both
 * were wrong in the same direction: a counter and then a dimension line,
 * each a second account of the load that the letters were already giving.
 * There is no bar, no percentage and no readout.
 *
 * The hold itself lives in `global.css`, keyed on the `data-preloading`
 * attribute that `boot.ts` sets before first paint.
 */
export default function Preloader({
  fullName,
}: {
  fullName: string;
}): React.ReactElement | null {
  // The name is handed down rather than read here, and it is the SAME
  // string the masthead is built from — see MainLayout. The curtain lands
  // its letters on that heading exact to the pixel, and it finds the
  // heading by matching this text against it, so two independent readings
  // of 'the name' would be a handover resting on a coincidence.
  const FULL_NAME = fullName;

  /** One entry per character. The key is stable because the string is. */
  const LETTERS = useMemo(
    () =>
      Array.from(FULL_NAME).map((char, index) => ({
        char,
        key: `${index}${char}`,
      })),
    [FULL_NAME],
  );

  // Server and first client render agree: the markup always ships. Whether
  // it is *painted* is decided in CSS from the <html> attribute, which is
  // already correct at first paint, so there is no hydration mismatch to
  // reconcile and no frame of half-dressed page.
  const [active, setActive] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const maskRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const refRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const root = rootRef.current;
    const stage = stageRef.current;
    const mask = maskRef.current;
    const line = lineRef.current;
    const ref = refRef.current;

    if (!shouldRun || !root || !mask || !line || !ref || !stage) {
      setActive(false);
      return;
    }

    // Asserted, not assumed. On a remount the cleanup below has already
    // released it, and the hold has to go back on before the first frame
    // this pass paints.
    html.setAttribute(PRELOADING_ATTR, "");

    // From here the panel's visibility is ours, not the attribute's — the
    // exit removes the attribute halfway through and must not yank the
    // curtain out from under its own animation.
    root.classList.add("st-preloader--running");

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const letters = Array.from(
      line.querySelectorAll<HTMLElement>("[data-letter]"),
    );

    /**
     * Exempt the measured elements from implicit transitions.
     *
     * `global.css`'s reduced-motion block sets `transition-duration` on
     * every element, and `transition-property` defaults to `all` — so under
     * `reduce` it does not shorten existing transitions, it gives every
     * property one. A transitioned property does not take its new value
     * synchronously, which turns every write-then-measure below into a read
     * of the value before the write, and the fit then solves against its
     * own previous output. Measured at 61 passes of a damped oscillation,
     * settling 70px short of the masthead it was about to be handed to.
     *
     * Inline `!important` is what it takes, because an `!important` is what
     * created the transition. Nothing in this curtain is CSS-animated in
     * the first place — it is a GSAP timeline, which is why `reduced` is
     * read here in JavaScript at all — so this takes nothing away from the
     * promise that block makes.
     */
    // The letters are in the list because `letter-spacing` is inherited:
    // each span transitions its own copy of the corrected value, so its box
    // is a frame behind even when the line's is not. Exempting the line
    // alone took the error from 70px down to 3px and no further.
    for (const element of [stage, mask, line, ref, ...letters]) {
      element.style.setProperty("transition", "none", "important");
    }
    const done = { fonts: false, load: false };
    let forced = false;
    let exiting = false;
    let rafId = 0;
    let last = 0;
    // Visible time, not wall-clock: rAF does not fire in a background tab,
    // so accumulating deltas is what makes the minimum hold 1.2s of
    // curtain the reader actually saw. A tab loaded in the background and
    // opened later gets the full gesture rather than one already spent.
    let visible = 0;
    // When the last letter finishes. Infinite until the line is placed, so
    // the exit test cannot pass before there is anything to hand over.
    let settled = Number.POSITIVE_INFINITY;
    let timeline: gsap.core.Timeline | null = null;

    // ── Geometry ──────────────────────────────────────────────────────
    // The column is known from the first frame: it is the viewport less
    // two gutters, and the stylesheet decides the gutter. The *size* is
    // not, because it depends on a webfont that has not arrived, so the
    // line stays hidden until it does.
    const column = (): { left: number; width: number } => {
      const probe = document.createElement("div");
      probe.className = "px-[var(--gut)]";
      probe.style.cssText =
        "position:absolute;left:0;top:0;width:100%;visibility:hidden";
      document.body.appendChild(probe);
      const style = getComputedStyle(probe);
      const left = parseFloat(style.paddingLeft) || 0;
      const right = parseFloat(style.paddingRight) || 0;
      probe.remove();

      // The curtain holds `overflow: hidden` on <html>, so there is no
      // scrollbar right now and clientWidth reads one scrollbar too wide
      // for the page that is about to exist. Measure the difference rather
      // than assume it: zero on overlay scrollbars, ~15px on classic ones.
      const gauge = document.createElement("div");
      gauge.style.cssText =
        "position:absolute;top:-9999px;width:100px;height:100px;overflow:scroll";
      document.body.appendChild(gauge);
      const scrollbar = gauge.offsetWidth - gauge.clientWidth;
      gauge.remove();

      return {
        left,
        width: Math.max(1, html.clientWidth - left - right - scrollbar),
      };
    };

    const { left: gutter, width: columnWidth } = column();
    let geom: Geometry | null = null;
    let placed = false;
    /** The previous frame's read, for the stability test in `tick`. */
    let steady: { size: number; run: number } | null = null;

    /** The size that fills `columnWidth`, measured on a detached probe.
     *  Only used where there is no masthead to read it off — a reload on a
     *  project page. Same method as useFittedText, and for the same reason:
     *  a per-character coefficient does not exist. */
    const probeSize = (): number => {
      const style = getComputedStyle(line);
      const probe = document.createElement("span");
      probe.textContent = FULL_NAME;
      probe.style.cssText =
        "position:absolute;left:-99999px;top:0;white-space:pre;visibility:hidden;pointer-events:none";
      probe.style.fontFamily = style.fontFamily;
      probe.style.fontWeight = style.fontWeight;
      probe.style.fontSize = `${PROBE_PX}px`;
      // letter-spacing computes to px against the element's CURRENT size,
      // so carrying the px value onto a 100px probe applies the wrong
      // tracking. Re-express it as a ratio first.
      const tracking = parseFloat(style.letterSpacing);
      const currentPx = parseFloat(style.fontSize) || PROBE_PX;
      probe.style.letterSpacing = Number.isNaN(tracking)
        ? "normal"
        : `${tracking / currentPx}em`;
      document.body.appendChild(probe);
      const natural = probe.getBoundingClientRect().width;
      probe.remove();
      return natural > 0 ? columnWidth / (natural / PROBE_PX) : 0;
    };

    /** How long to wait for the masthead to solve before giving up on it
     *  and measuring the string here instead. Visible ms, like the hold. */
    const FIT_DEADLINE_MS = 2500;

    /**
     * Whether the display face is actually in use yet.
     *
     * `document.fonts.ready` is not that promise. It resolves when nothing
     * is *pending*, which includes the window before the first layout that
     * needs the face has asked for it — measured here resolving while the
     * masthead still rendered in the fallback, `--fit-size` already written
     * as 257px and the line still running 826px instead of 1330px. Both
     * numbers look settled and neither is. Asking for the family by name
     * is the question that was meant.
     */
    const faceReady = (): boolean => {
      const family =
        getComputedStyle(line).fontFamily.split(",")[0]?.trim() ?? "";
      if (family === "") return true;
      try {
        return document.fonts.check(`700 100px ${family}`, FULL_NAME);
      } catch {
        return true;
      }
    };

    /** The masthead's line, or null on a page that has no masthead. */
    const heading = (): HTMLElement | null => {
      const el = document.getElementById("open-heading");
      return el !== null && el.textContent?.trim() === FULL_NAME ? el : null;
    };

    /**
     * Its solved box, or null while the answer is not yet knowable.
     *
     * The size comes from the `--fit-size` custom property that
     * useFittedText writes, NOT from the computed font-size. They are only
     * the same once the fit has run: `.st-fit` falls back to a clamp until
     * then, and the clamp is nowhere near the solved value — measured at
     * 160px against a real 257px, which the curtain then handed over to as
     * a visible jump. The property being absent is the signal that the
     * masthead has not finished, and the only reliable one; two rAFs after
     * `fonts.ready` is a race, because useFittedText is listening to that
     * same promise from a different component tree.
     */
    const readHeading = (el: HTMLElement): Geometry | null => {
      const fit = parseFloat(el.style.getPropertyValue("--fit-size"));
      const box = el.getBoundingClientRect();
      if (!Number.isFinite(fit) || fit <= 0 || box.width <= 0) return null;
      return { left: box.left, top: box.top, size: fit, run: textWidth(el) };
    };

    const resolve = (): Geometry | null => {
      const el = heading();

      if (el !== null) {
        const read = readHeading(el);
        if (read !== null) return read;
        // Still solving. Keep waiting unless it has taken so long that
        // something is wrong, in which case fall through and measure.
        if (visible < FIT_DEADLINE_MS) return null;
      }

      const size = probeSize();
      if (size <= 0) return null;
      // No masthead to land on — a reload on a project page. Put the line
      // where the masthead would have been anyway, and leave the tracking
      // alone, because there is nothing to match it to.
      return {
        left: gutter,
        top: Math.max(gutter, html.clientHeight / 2 - size * 0.45),
        size,
        run: 0,
      };
    };

    // Where the line sits inside the stage, which is whatever the mask's
    // padding adds up to. Read once per size rather than per frame.
    let lineOffset = 0;

    /**
     * How far the ink overhangs the line box, in px at the current size.
     *
     * `.st-display` sets `line-height: 0.9`, which is tighter than the
     * face's own ascent plus descent, so the glyphs stick out of their own
     * box at both ends and a mask cut to the box alone would shave the
     * caps and the descenders. Asking the font is exact; the alternative
     * is an em guess that is either too tight on one face or, at 0.22em,
     * leaves 56px of paper where letters float in full view instead of
     * arriving out of an edge.
     */
    const overhang = (): number => {
      const style = getComputedStyle(line);
      const size = parseFloat(style.fontSize) || 0;
      const box = parseFloat(style.lineHeight) || size;
      const context = document.createElement("canvas").getContext("2d");
      if (context === null) return size * FALLBACK_OVERHANG;
      context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      const m = context.measureText(FULL_NAME);
      const em = m.fontBoundingBoxAscent + m.fontBoundingBoxDescent;
      if (!Number.isFinite(em) || em <= 0) return size * FALLBACK_OVERHANG;
      // Where the baseline sits inside the line box, half-leading included.
      const baseline = (box - em) / 2 + m.fontBoundingBoxAscent;
      const above = m.actualBoundingBoxAscent - baseline;
      const below = m.actualBoundingBoxDescent - (box - baseline);
      return Math.max(0, above, below) + 2;
    };

    /**
     * Size the line and put every letter exactly where the masthead's is.
     *
     * Splitting a string into one box per character keeps its tracking —
     * CSS adds letter-spacing after every character, inside whichever box
     * that character is in — but it loses the kerning, because there are no
     * longer two adjacent characters for the pairs to apply to. Putting the
     * difference back as extra tracking, spread over the whole line, is
     * wrong in a way that is invisible to a measurement of the total run:
     * the two ends land and the middle does not. Measured: first letter out
     * by 0, last by 1.2px, the `o` in between by 6.6px.
     *
     * So the offsets are not computed at all. `ref` holds the same string
     * unsplit, at the same size in the same face, which is the masthead's
     * own layout by construction; a range over each of its characters says
     * where that character goes, kerning included, and the letters are
     * placed there absolutely. Nothing is divided by a character count and
     * nothing is spread.
     */
    const dress = (): boolean => {
      if (geom === null) return false;
      // On the line rather than on the stage. Reading a descendant's
      // computed font-size in the same turn as writing an ancestor's came
      // back one frame stale here.
      line.style.fontSize = `${geom.size}px`;
      const box = parseFloat(getComputedStyle(line).lineHeight) || geom.size;
      // Every child is out of flow, so the line has no height of its own
      // and the mask would collapse to its padding.
      line.style.height = `${box}px`;

      const node = ref.firstChild;
      if (node === null) return false;
      void ref.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(ref);
      const whole = range.getBoundingClientRect();
      if (whole.width <= 0) return false;

      // The reference is the masthead's line in everything but position, so
      // if it does not run as far as the masthead's, the face has not
      // arrived and none of these offsets are the right ones yet.
      if (geom.run > 0 && Math.abs(whole.width - geom.run) > 1) return false;

      const offsets: number[] = [];
      for (let index = 0; index < FULL_NAME.length; index += 1) {
        if (FULL_NAME[index] === " ") continue;
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        offsets.push(range.getBoundingClientRect().left - whole.left);
      }
      if (offsets.length !== letters.length) return false;

      letters.forEach((element, index) => {
        element.style.left = `${offsets[index]}px`;
      });
      line.style.width = `${whole.width}px`;

      // The mask's padding is owned here rather than in the class list,
      // because only a measurement knows how much of it the ink needs. The
      // negative margin takes it straight back out of the layout, so the
      // line's offset inside the stage stays zero.
      const pad = Math.round(overhang());
      mask.style.padding = `${pad}px 0`;
      mask.style.margin = `${-pad}px 0`;
      lineOffset = line.offsetTop;

      // Checked, not assumed: every letter has to be where it was told to
      // go before the paper is allowed to show it.
      const origin = line.getBoundingClientRect().left;
      return letters.every(
        (element, index) =>
          Math.abs(
            element.getBoundingClientRect().left - (origin + offsets[index]),
          ) <= 0.5,
      );
    };

    /**
     * Hand the letters back to ordinary text rendering.
     *
     * A transform — even the identity one a finished tween leaves behind —
     * and a `will-change` hint both put an element on its own raster path,
     * where glyph edges are antialiased slightly differently from the same
     * glyph in normal flow. The letters are not moving any more by this
     * point, and the whole purpose of the next second is that the paper
     * dissolves onto a line that is identical, so the difference is worth
     * removing rather than explaining.
     */
    const rest = (): void => {
      gsap.set(letters, { clearProps: "transform" });
      for (const element of letters) element.style.willChange = "auto";
    };

    /** Put the apparatus at the answer, show it, and start the letters.
     *  Once only. */
    const place = (): void => {
      if (geom === null || placed) return;
      if (!dress()) return;
      placed = true;
      stage.style.left = `${geom.left}px`;
      stage.style.top = `${geom.top - lineOffset}px`;

      if (reduced) {
        // Shown assembled rather than assembling: nine letters each
        // travelling more than their own height is a large movement, and
        // that is the case this query is centrally about. The hold still
        // runs and the status line still announces; the plate is static.
        // The paper still fades in, because an opacity change is not the
        // movement the query is about — the same call PageTransition makes.
        rest();
        settled = visible;
        timeline = gsap
          .timeline()
          .to(stage, { opacity: 1, duration: 0.24, ease: "none" });
        return;
      }

      const spread = Math.min(
        STAGGER_MS,
        MAX_SPREAD_MS / Math.max(1, letters.length - 1),
      );
      settled = visible + spread * (letters.length - 1) + LETTER_MS;

      timeline = gsap.timeline();
      timeline.to(stage, { opacity: 1, duration: 0.24, ease: "none" }, 0);
      timeline.to(
        letters,
        {
          yPercent: 0,
          duration: LETTER_MS / 1000,
          ease: "expo.out",
          stagger: spread / 1000,
          onComplete: rest,
        },
        0,
      );
    };

    /**
     * Keep the line locked to the masthead for as long as the curtain is
     * up.
     *
     * `--fit-size` being present says the *size* is settled; it says
     * nothing about the *position*, which depends on the section's own
     * centring and therefore on the intro paragraph below it reflowing
     * when the text face arrives. Read once and the line lands 44px below
     * where the masthead ends up — measured, and the dissolve then shows
     * it jumping. Re-reading every frame costs one rect and makes the
     * coincidence true by construction rather than by timing.
     */
    const sync = (): void => {
      const el = heading();
      if (el === null || geom === null) return;
      const read = readHeading(el);
      if (read === null) return;
      const resized =
        Math.abs(read.size - geom.size) > 0.5 ||
        Math.abs(read.run - geom.run) > 0.5;
      geom = read;
      if (resized) dress();
      stage.style.left = `${geom.left}px`;
      stage.style.top = `${geom.top - lineOffset}px`;
    };

    // ── Real signals ──────────────────────────────────────────────────
    void document.fonts.ready.then(() => {
      done.fonts = true;
    });

    const onLoad = (): void => {
      done.load = true;
    };
    // There are no <img> in the hero yet, so `load` is the catch-all for
    // every subresource the first screen depends on. It may already have
    // fired by the time this effect runs.
    if (document.readyState === "complete") done.load = true;
    else window.addEventListener("load", onLoad, { once: true });

    const capTimer = window.setTimeout(() => {
      forced = true;
    }, HARD_CAP_MS);

    // SmoothScroll is our parent, and parent effects run after child
    // effects — Lenis does not exist yet. A zero timeout lands just after
    // it is created. The CSS lock covers the frames before that.
    const lenisTimer = window.setTimeout(() => {
      window.lenis?.stop();
    }, 0);

    // ── Lifecycle ─────────────────────────────────────────────────────
    const frozen: Element[] = [];

    const cleanup = (): void => {
      if (rafId !== 0) cancelAnimationFrame(rafId);
      rafId = 0;
      window.clearTimeout(capTimer);
      window.clearTimeout(lenisTimer);
      window.removeEventListener("load", onLoad);
      timeline?.kill();
      timeline = null;
    };

    /** Hands the page back: animations resume, scroll unlocks, the content
     *  re-enters the accessibility tree. Idempotent — the exit calls it
     *  mid-dissolve and unmount calls it again. */
    const release = (): void => {
      html.removeAttribute(PRELOADING_ATTR);
      for (const element of frozen) element.removeAttribute("inert");
      frozen.length = 0;
      if (statusRef.current !== null) statusRef.current.textContent = "";
      window.clearTimeout(lenisTimer);
      window.lenis?.start();
    };

    const finish = (): void => {
      cleanup();
      release();
      setActive(false);
    };

    const exit = (): void => {
      timeline?.kill();
      if (reduced) {
        release();
        timeline = gsap
          .timeline({ onComplete: finish })
          .to(root, { opacity: 0, duration: 0.25, ease: "none" });
        return;
      }

      const dissolve = readMs("--t-handoff", FALLBACK_DISSOLVE) / 1000;

      // Nothing else moves. What is on the paper is a line at the size the
      // masthead solved to, sitting exactly where the masthead's is, so
      // the dissolve is a cut between two identical frames.
      timeline = gsap.timeline({ onComplete: finish });
      timeline.to(
        root,
        { opacity: 0, duration: dissolve, ease: "power2.inOut" },
        0,
      );
      // Released mid-dissolve on purpose: the corner marks' st-fade is held
      // by the attribute, so the frame comes up around the name while the
      // paper is still going. Moving this to the end gives a dead beat.
      timeline.add(release, dissolve * 0.45);
    };

    /** Everything that has to be true before the paper can go. */
    const ready = (): boolean => {
      if (forced) return true;
      if (geom === null || !done.fonts || !done.load) return false;
      return visible >= MIN_HOLD_MS && visible >= settled;
    };

    const tick = (now: number): void => {
      rafId = requestAnimationFrame(tick);

      // Capped so the first frame back from a hidden tab does not land as
      // one enormous delta and skip the whole hold in a single step.
      const delta = last === 0 ? 16 : Math.min(now - last, 100);
      last = now;
      visible += delta;

      // Asked every frame rather than scheduled, because the answer
      // depends on another component finishing work we cannot observe.
      if (!placed) {
        // The deadline is the escape hatch for a face that never arrives:
        // past it the string is measured here instead, in whatever is
        // rendering.
        const settledFont =
          done.fonts && (faceReady() || visible >= FIT_DEADLINE_MS);
        const read = settledFont ? resolve() : null;
        if (read !== null) {
          // `--fit-size` being present says useFittedText has written a
          // value, not that it has written its LAST one: it is set on the
          // way through the search as well. A single read catches that and
          // dresses the line to a run the masthead has already left —
          // measured at 826px against a real 1330px, corrected a frame
          // later, which is invisible behind the fade and a visible pop
          // under `reduce`, where there is no fade. Two consecutive frames
          // agreeing is the cheapest test that it has stopped moving.
          if (
            steady !== null &&
            Math.abs(steady.size - read.size) < 0.5 &&
            Math.abs(steady.run - read.run) < 0.5
          ) {
            geom = read;
            place();
          }
          steady = { size: read.size, run: read.run };
        }
      } else if (!exiting) {
        sync();
      }

      if (!exiting && ready()) {
        exiting = true;
        exit();
      }
    };

    // ── Freeze the page behind the curtain ────────────────────────────
    // `inert` rather than a focus trap: there is nothing in here to trap
    // focus on, and inert takes the content out of the accessibility tree
    // as well, so a screen reader is not free-roaming a page that is
    // visually covered.
    for (const child of Array.from(document.body.children)) {
      if (child === root || child.hasAttribute("inert")) continue;
      child.setAttribute("inert", "");
      frozen.push(child);
    }

    // Filling the live region after mount is what makes it announce; text
    // present at first render is often missed.
    if (statusRef.current !== null) statusRef.current.textContent = "Loading";

    // Parked before the first frame the stage could possibly be visible
    // on. GSAP owns this transform for the whole gesture — there is no
    // class carrying one, because the two compose rather than replace.
    gsap.set(letters, {
      yPercent: (i: number) => (i % 2 === 0 ? -DROP_PERCENT : DROP_PERCENT),
    });

    rafId = requestAnimationFrame(tick);

    return () => {
      cleanup();
      release();
    };
  }, [FULL_NAME]);

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      className="st-preloader fixed inset-0 z-[200] bg-[var(--paper)]"
    >
      <p ref={statusRef} className="sr-only" role="status" />

      {/* Decorative: the status above is the whole accessible content, and
          the name is announced properly by the hero's own h1 a moment
          later. */}
      <div aria-hidden="true" className="h-full">
        <div ref={stageRef} className="absolute top-0 left-0 opacity-0">
          {/* The mask. Its padding is measured and written by the effect,
              not set here: see `overhang`. */}
          <div ref={maskRef} className="overflow-hidden">
            <div
              ref={lineRef}
              className="st-display relative text-[var(--ink)]"
            >
              {/* The line the masthead would set, unsplit, so it still
                  kerns. Never seen — it is only measured, one character at
                  a time, to say where each letter below belongs. */}
              <span
                ref={refRef}
                className="absolute top-0 left-0 whitespace-pre opacity-0"
              >
                {FULL_NAME}
              </span>

              {LETTERS.filter((letter) => letter.char !== " ").map((letter) => (
                <span
                  key={letter.key}
                  data-letter=""
                  className="absolute top-0 left-0 will-change-transform"
                >
                  {letter.char}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
