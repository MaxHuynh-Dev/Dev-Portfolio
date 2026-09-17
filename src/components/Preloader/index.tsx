'use client';

import gsap from 'gsap';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { PROFILE } from '@/content/site';

import { PRELOAD_SESSION_KEY, PRELOADING_ATTR } from './boot';

/**
 * How much of the bar each real signal is worth.
 *
 * There used to be a third: the WebGL stage's first rendered frame, worth
 * 40%. The stage is gone, so these are the two that remain — the same split
 * the phone path always used.
 */
const WEIGHTS = { fonts: 0.65, load: 0.35 };

/** The curtain holds at least this long so it reads as a deliberate
 *  gesture. The page is prerendered and small; on a warm cache every real
 *  signal resolves in well under 300ms, which would only ever flash. */
const MIN_HOLD_MS = 1200;

/** Absolute ceiling. Nothing justifies holding a reader behind a curtain
 *  longer than this, including a webfont that never arrives. */
const HARD_CAP_MS = 6000;

/** Time constant of the displayed-value easing, in ms. Frame-rate
 *  independent, so 120Hz displays do not count up twice as fast. */
const SMOOTHING_MS = 90;

/**
 * Whether this page load gets a curtain at all, snapshotted at module
 * evaluation — which happens once per load, and always after the blocking
 * head script has run.
 *
 * Reading the attribute inside the effect instead is self-defeating:
 * StrictMode invokes effects twice in development, and the first pass's
 * cleanup releases the attribute, so the second pass finds nothing to do
 * and unmounts the curtain for good. A Fast Refresh remount does the same.
 * The effect re-asserts ownership below rather than trusting what it finds.
 */
const shouldRun =
  typeof document !== 'undefined' && document.documentElement.hasAttribute(PRELOADING_ATTR);

/**
 * The curtain.
 *
 * Its visible job is a counter and a rule; its real job is to hold the
 * page's load-time animations — the hero's mask-rise and the
 * corner marks' fade — and hand them off mid-wipe, so the reveal is one
 * gesture rather than a lift onto an already-finished page.
 *
 * The hold itself lives in `global.css`, keyed on the `data-preloading`
 * attribute that `boot.ts` sets before first paint.
 */
export default function Preloader(): React.ReactElement | null {
  // Server and first client render agree: the markup always ships. Whether
  // it is *painted* is decided in CSS from the <html> attribute, which is
  // already correct at first paint — so a repeat visitor never sees a frame
  // of curtain, and there is no hydration mismatch to reconcile.
  const [active, setActive] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const root = rootRef.current;
    const inner = innerRef.current;
    const counter = counterRef.current;
    const bar = barRef.current;

    // Not running means the boot script found the session flag. Drop the
    // markup; CSS has already kept it from painting.
    if (!shouldRun || !root || !inner || !counter || !bar) {
      setActive(false);
      return;
    }

    // Asserted, not assumed. On a remount the cleanup below has already
    // released it, and the hold has to go back on before the first frame
    // this pass paints.
    html.setAttribute(PRELOADING_ATTR, '');

    // From here the panel's visibility is ours, not the attribute's — the
    // exit removes the attribute mid-wipe and must not yank the curtain out
    // from under its own animation.
    root.classList.add('st-preloader--running');

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const done = { fonts: false, load: false };
    let forced = false;
    let exiting = false;
    let shown = 0;
    let rafId = 0;
    let last = 0;
    // Visible time, not wall-clock: rAF does not fire in a background tab,
    // so accumulating deltas is what makes the minimum hold 1.2s of
    // curtain the reader actually saw. A tab loaded in the background and
    // opened later gets the full gesture rather than a wipe already spent.
    let visible = 0;
    let timeline: gsap.core.Timeline | null = null;

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
    if (document.readyState === 'complete') done.load = true;
    else window.addEventListener('load', onLoad, { once: true });

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
      window.removeEventListener('load', onLoad);
      timeline?.kill();
      timeline = null;
    };

    /** Hands the page back: animations resume, scroll unlocks, the content
     *  re-enters the accessibility tree. Idempotent — the exit calls it
     *  mid-timeline and unmount calls it again. */
    const release = (): void => {
      html.removeAttribute(PRELOADING_ATTR);
      for (const element of frozen) element.removeAttribute('inert');
      frozen.length = 0;
      if (statusRef.current !== null) statusRef.current.textContent = '';
      window.clearTimeout(lenisTimer);
      window.lenis?.start();
    };

    const finish = (): void => {
      cleanup();
      release();
      try {
        sessionStorage.setItem(PRELOAD_SESSION_KEY, '1');
      } catch {
        // Storage unavailable. The curtain shows again next navigation,
        // which is the harmless direction to fail in.
      }
      setActive(false);
    };

    const exit = (): void => {
      if (reduced) {
        // Motion parked. The reduced-motion guard has already collapsed
        // st-rise and st-fade to 0.01ms, so there is no gesture left to
        // chain into — clear the panel and get out of the way.
        release();
        timeline = gsap.timeline({ onComplete: finish }).to(root, {
          opacity: 0,
          duration: 0.25,
          ease: 'none'
        });
        return;
      }

      timeline = gsap.timeline({ onComplete: finish });
      // The name and counter leave first, so the panel is empty as it lifts.
      timeline.to(inner, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);
      // Bottom-up, which means the hero's name — at the top of the
      // viewport — is the last thing uncovered.
      timeline.to(root, { yPercent: -100, duration: 0.95, ease: 'power3.inOut' }, 0.1);
      // Released mid-wipe on purpose. st-rise runs 1.1s and also travels
      // upward, so the name comes up behind the curtain's trailing edge
      // instead of waiting for it. Moving this to the end of the timeline
      // gives you a dead beat and a static hero — the exact thing the hold
      // exists to prevent.
      timeline.add(release, 0.62);
    };

    // ── Progress ──────────────────────────────────────────────────────
    const paint = (value: number): void => {
      counter.textContent = String(Math.round(value * 100)).padStart(2, '0');
      bar.style.transform = `scaleX(${value})`;
    };

    const tick = (now: number): void => {
      rafId = requestAnimationFrame(tick);
      // Capped so the first frame back from a hidden tab does not land as
      // one enormous delta and skip the whole hold in a single step.
      const delta = last === 0 ? 16 : Math.min(now - last, 100);
      last = now;
      visible += delta;

      const signal = forced ? 1 : (done.fonts ? WEIGHTS.fonts : 0) + (done.load ? WEIGHTS.load : 0);

      // The number outruns neither constraint, so it stays honest about
      // both what has loaded and how much of the hold is left.
      const target = forced ? 1 : Math.min(signal, visible / MIN_HOLD_MS);

      if (reduced) shown = target;
      else {
        shown += (target - shown) * (1 - Math.exp(-delta / SMOOTHING_MS));
        if (Math.abs(target - shown) < 0.004) shown = target;
      }
      paint(shown);

      if (!exiting && target >= 1 && shown >= 1) {
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
      if (child === root || child.hasAttribute('inert')) continue;
      child.setAttribute('inert', '');
      frozen.push(child);
    }

    // Filling the live region after mount is what makes it announce; text
    // present at first render is often missed.
    if (statusRef.current !== null) statusRef.current.textContent = 'Loading';

    paint(0);
    rafId = requestAnimationFrame(tick);

    return () => {
      cleanup();
      release();
    };
  }, []);

  if (!active) return null;

  return (
    <div
      ref={rootRef}
      className="st-preloader fixed inset-0 z-[200] bg-[var(--paper)] will-change-transform"
    >
      <p ref={statusRef} className="sr-only" role="status" />

      {/* Decorative: the status above is the whole accessible content, and
          the name is announced properly by the hero's own h1 a moment later. */}
      <div
        ref={innerRef}
        aria-hidden="true"
        className="grid h-full grid-rows-[auto_1fr_auto] px-[var(--gut)] pt-[clamp(3.75rem,11vh,9rem)] pb-[clamp(2rem,6vh,4rem)]"
      >
        <div className="flex items-start justify-between gap-6">
          <span className="st-meta">{PROFILE.role.toLowerCase()}</span>
          <span className="st-meta">{PROFILE.location.toLowerCase()}</span>
        </div>

        <span />

        <div className="flex flex-col gap-[0.9rem]">
          <div className="flex items-end justify-between gap-[clamp(1rem,4vw,4rem)]">
            <span className="st-display text-[clamp(1.6rem,4.4vw,3.2rem)]">
              {PROFILE.firstName} {PROFILE.lastName}
            </span>
            <span
              ref={counterRef}
              className="st-display st-display-reg text-[clamp(1.4rem,3.4vw,2.6rem)] tabular-nums leading-none"
            >
              00
            </span>
          </div>

          <span className="block h-px w-full bg-[var(--ink-3)]">
            <span
              ref={barRef}
              className="block h-full w-full origin-left scale-x-0 bg-[var(--ink)]"
            />
          </span>
        </div>
      </div>
    </div>
  );
}
