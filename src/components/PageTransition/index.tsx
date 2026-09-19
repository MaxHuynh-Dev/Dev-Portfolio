'use client';

import { markRouted } from '@Hooks/useReveal';
import gsap from 'gsap';
import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useRef, useTransition } from 'react';

/** Fallbacks if the tokens in global.css are renamed out from under us. */
const FALLBACK = { cover: 500, reveal: 560 };

/**
 * Nothing justifies holding a reader behind a panel longer than this. If
 * the route has not arrived by now it is not arriving, and a stuck curtain
 * is worse than a page that changed without ceremony.
 */
const HARD_CAP_MS = 3000;

/**
 * The destination's name, split into characters and risen out of one mask
 * each — the same verb the preloader's letters use, at the other end of the
 * journey.
 *
 * **The split is allowed to be naive here, and trap 10 is why that needs
 * saying.** Splitting a string into one box per character loses its kerning
 * pairs, and the preloader had to go to a hidden unsplit copy and a Range
 * per character to get them back, because it lands its letters on the real
 * masthead exact to the pixel. This word lands on nothing. It only has to
 * look right, it is set in CAPS — which carry far fewer critical pairs than
 * lowercase — and the positive tracking caps want has already separated
 * them. The total advance survives a split regardless; only the pairs do
 * not.
 *
 * `LEAD` is a FRACTION of the cover rather than a duration, so the word
 * starts at the same point in the sweep whatever `--t-cover` is set to.
 *
 * **It is 1, which means the panel lands before a single letter moves.**
 * It was 0.2, and that read as one event rather than two: the letters rose
 * inside a panel that was itself still rising, so relative to the screen
 * they travelled at panel speed plus their own and the word arrived at the
 * same moment its ground did. Sequenced, the curtain shuts and only then
 * does the name come up out of it — which is the reading the owner asked
 * for, and it is also the one the preloader already uses: the paper is
 * there first, the letters arrive onto it.
 *
 * The cost is the whole stagger, added to the transition rather than hidden
 * inside the cover. That is what the sequence costs; it is not recoverable
 * by tuning. `LETTER_RISE_MS` and `LETTER_STEP_MS` are the knobs if it ever
 * needs to come down.
 */
const LETTER_STEP_MS = 40;
const LETTER_RISE_MS = 400;
const LETTER_LEAD = 1;
/** Faster out than in. An exit that matches its entrance reads as a rewind. */
const LETTER_EXIT_MS = 340;
const LETTER_EXIT_STEP_MS = 28;
/**
 * The word must stand still this long before the uncover may start.
 *
 * Without it a prefetched route arrives while the letters are still coming
 * up, and the first of them would begin leaving before the last had landed
 * — which does not read as a stagger, it reads as a glitch. It is the one
 * place this curtain deliberately makes the reader wait, and it is bounded:
 * the hold is over by the time the word is legible, not a beat later.
 */
const NAME_HELD_MS = 120;

/**
 * One element per character, each in its own clip.
 *
 * Segmented by GRAPHEME where the browser can: `Array.from` splits on code
 * points, which separates a combining diacritic from the letter it sits on
 * and would put the two in different masks. Vietnamese is normally
 * precomposed and the marks in the corner nav are ASCII, so this is belt
 * and braces — but it is three lines of it.
 */
const splitInto = (host: HTMLElement, text: string): HTMLElement[] => {
  host.textContent = '';
  const chars =
    typeof Intl !== 'undefined' && 'Segmenter' in Intl
      ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(
          (part) => part.segment
        )
      : Array.from(text);

  const bodies: HTMLElement[] = [];
  for (const char of chars) {
    // A space has nothing to clip and no ink to raise. Masking it would
    // add an empty animated box to the stagger and a gap to the rhythm.
    //
    // The character itself still goes IN, and the width only fixes its
    // advance. A spacer sized but empty reads back as `MaxHuynh` from the
    // DOM — trap 23's "I build it tohold up." in its other costume. It
    // costs nothing here today, because the panel is aria-hidden and the
    // status line carries the real string, and it would cost the moment
    // either of those changed or anyone selected the text.
    if (char.trim() === '') {
      const gap = document.createElement('span');
      gap.textContent = char;
      gap.style.width = '0.34em';
      host.appendChild(gap);
      continue;
    }
    const mask = document.createElement('span');
    mask.className = 'st-curtain-letter';
    const body = document.createElement('span');
    body.textContent = char;
    mask.appendChild(body);
    host.appendChild(mask);
    bodies.push(body);
  }
  return bodies;
};

/**
 * Raised on `<html>` for as long as this panel is in the way.
 *
 * It is what lets a masked block on the destination page know it is being
 * committed behind a closed curtain and should stay parked. Nothing in
 * `global.css` keys off it — it is a statement, not a mechanism, and that
 * is the point: `data-preloading` is not reused here because it also
 * pauses every animation on the page and switches on its own scroll lock,
 * neither of which this curtain wants (it stops Lenis itself).
 *
 * Removed in `settle` and in the effect's cleanup, for the same reason the
 * hold is capped: a reader left behind an invisible flag would be looking
 * at a page whose text never arrives.
 */
const ROUTING_ATTR = 'data-routing';

/**
 * The value the attribute carries, which is how `global.css` can hold the
 * destination blank for exactly the part of the transition where blanking
 * it is invisible.
 *
 * `useReleased` asks `hasAttribute` and observes with an `attributeFilter`,
 * so all three of these read as "a curtain is up" and a change from one to
 * the next simply re-fires the observer, which re-checks and finds it still
 * true. One attribute, three states, and nothing else to remember to clear.
 *
 * `covering` deliberately does NOT blank anything: the panel is still on
 * its way up and the reader is looking at the page they are leaving. Taking
 * it away underneath them is the jump this whole component exists to
 * remove.
 */
type Curtain = 'covering' | 'holding' | 'leaving';

type Phase = 'idle' | 'covering' | 'holding' | 'revealing';

const readMs = (name: string, fallback: number): number => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (raw.endsWith('ms')) return parseFloat(raw) || fallback;
  if (raw.endsWith('s')) return (parseFloat(raw) || fallback / 1000) * 1000;
  return fallback;
};

/**
 * The route curtain.
 *
 * A panel rises to cover the page, the next route is fetched and committed
 * behind it, the scroll is put back to the top, and the panel carries on
 * upward to uncover. One direction throughout — it never comes back down
 * the way it came, which is what makes it read as a sweep rather than a
 * shutter flapping.
 *
 * **Why this replaced a View Transitions crossfade.** That version snapshot
 * the outgoing page at whatever scroll offset the reader was at, and the
 * incoming one at zero, then cross-faded between the two. There is no
 * easing that makes those two images agree: the page visibly jumps. It was
 * not dropped frames — measured at a 13.4ms median with no long tasks — it
 * was two pictures of different places. Covering the swap is the fix, and
 * it is also the only way to honour "always start at the top", because the
 * scroll reset happens where nobody can see it.
 *
 * The router is only told to navigate once the panel is fully closed. Push
 * during the rise and React commits the new page while the top of the
 * screen is still showing the old one, which is the exact jump this exists
 * to remove. The prefetch at click time is what keeps that ordering cheap.
 *
 * **The name is centred, in caps, and assembled rather than faded.** It used
 * to sit in the bottom-left gutter and fade on, which put the one piece of
 * type on a full-bleed panel in the position type takes when it is a
 * caption. Centred it is the subject of the screen, so it is set larger and
 * it arrives the way everything else on this site arrives — out of a mask,
 * one piece at a time. **The panel lands first and the letters follow**, and
 * they leave upward through the same masks as it opens: nothing on this
 * curtain ever travels back the way it came.
 *
 * The push still happens the instant the PANEL is shut, not when the word
 * finishes — the route is fetched behind a closed curtain while the letters
 * are still landing, so the split costs the reader the tail of the stagger
 * and not the network.
 */
export default function PageTransition(): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const panelRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  const phase = useRef<Phase>('idle');
  const target = useRef<URL | null>(null);
  const capTimer = useRef(0);
  /** Deferral for NAME_HELD_MS. Cleared wherever capTimer is. */
  const nameTimer = useRef(0);
  const tl = useRef<gsap.core.Timeline | null>(null);
  // `reveal` is called from a GSAP callback, from an effect, and from a
  // timeout. A ref keeps all three pointing at one live function without
  // making every caller depend on its identity.
  const revealRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const panel = panelRef.current;
    const label = labelRef.current;
    const status = statusRef.current;
    if (!panel || !label || !status) return;

    // Parked here and nowhere else. An earlier version also carried
    // Tailwind's `translate-y-full`, and GSAP's yPercent composes with the
    // transform it finds rather than replacing it: the two stacked to 200%,
    // so "covered" left the panel a full viewport BELOW the screen and the
    // route changed behind a curtain nobody ever saw. Measured at 1800px on
    // a 900px viewport. The class is gone; this owns the transform.
    gsap.set(panel, { yPercent: 100, opacity: 1 });
    label.textContent = '';

    /** The current word's characters. Rebuilt per navigation, torn down in `settle`. */
    let letters: HTMLElement[] = [];
    /** When the last of them lands. `reveal` will not start before it. */
    let nameRestAt = 0;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coverMs = readMs('--t-cover', FALLBACK.cover);
    const revealMs = readMs('--t-reveal', FALLBACK.reveal);

    const raise = (at: Curtain): void => {
      document.documentElement.setAttribute(ROUTING_ATTR, at);
    };

    const settle = (): void => {
      phase.current = 'idle';
      target.current = null;
      window.clearTimeout(capTimer.current);
      window.clearTimeout(nameTimer.current);
      // The page is handed back HERE, at the end of the uncover, and not at
      // the start of it. The panel rises to uncover, so the top of the
      // screen is the last thing it clears — and the top of the screen is
      // where the block waiting on `load` is. Releasing when the tween
      // starts would play its rise behind the part of the panel that has
      // not moved yet.
      document.documentElement.removeAttribute(ROUTING_ATTR);
      panel.style.pointerEvents = 'none';
      panel.style.visibility = 'hidden';
      status.textContent = '';
      // Parked below the fold again, ready for the next one. The word is
      // torn down rather than hidden: the next navigation builds its own,
      // and a stale one left behind is the first thing the next cover would
      // show, already at rest, before its own letters had been placed.
      gsap.set(panel, { yPercent: 100, opacity: 1 });
      label.textContent = '';
      letters = [];
      nameRestAt = 0;
      window.lenis?.start();
    };

    /** Under the panel, where none of this is visible. */
    const toTop = (): void => {
      const hash = target.current?.hash ?? '';
      // An explicit fragment is a destination the reader asked for by name,
      // so it wins over the top of the page. Everything else starts at the
      // top: that is the whole point of covering the swap.
      const anchor = hash.length > 1 ? document.querySelector(hash) : null;

      if (anchor instanceof HTMLElement) {
        const padding =
          parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
        const top = anchor.getBoundingClientRect().top + window.scrollY - padding;
        window.scrollTo(0, top);
        window.lenis?.scrollTo(top, { immediate: true, force: true });
        return;
      }

      window.scrollTo(0, 0);
      // Lenis keeps its own scroll value and would spring back to the old
      // one on the first wheel tick without this.
      window.lenis?.scrollTo(0, { immediate: true, force: true });
    };

    const reveal = (): void => {
      if (phase.current !== 'holding') return;

      // A prefetched route can arrive before the word has. Wait out the rest
      // of the stagger plus a beat, or the first letters begin leaving
      // before the last have landed — which does not read as a stagger, it
      // reads as a glitch.
      //
      // It cannot become an open-ended wait: `nameRestAt` is computed at
      // `go` from durations that are all constants, and the 3s cap is armed
      // underneath this the whole time.
      const wait = nameRestAt + NAME_HELD_MS - performance.now();
      if (wait > 0) {
        window.clearTimeout(nameTimer.current);
        nameTimer.current = window.setTimeout(() => {
          nameRestAt = 0;
          reveal();
        }, wait);
        return;
      }

      phase.current = 'revealing';
      // RE-ARMED, not cleared. The uncover is a GSAP tween and GSAP runs on
      // rAF, which a backgrounded tab suspends — so `onComplete` never
      // fires, `settle` never runs, and the attribute stays up. That used to
      // mean a few parked reveals on an otherwise visible page; now that the
      // attribute also empties the page during the hold, it would mean a
      // blank one. "The route curtain must always let go" has to cover the
      // uncover too, not just the hold.
      window.clearTimeout(capTimer.current);
      capTimer.current = window.setTimeout(settle, HARD_CAP_MS);

      // The gate comes off at the START of the uncover, so the strip the
      // panel clears shows the page in its PARKED state — masks empty,
      // display type below its clip — rather than a blank sheet. The
      // reveals themselves still wait for `settle` at the end, which is
      // what keeps them from playing behind the part of the panel that has
      // not moved yet.
      raise('leaving');
      toTop();

      // Focus follows the navigation. preventDefault cancelled the
      // browser's own focus move along with the jump, and without this a
      // keyboard reader stays on a link that no longer exists.
      document.getElementById('content')?.focus({ preventScroll: true });

      tl.current?.kill();
      if (reduced) {
        tl.current = gsap
          .timeline({ onComplete: settle })
          .to(panel, { opacity: 0, duration: 0.14, ease: 'none' });
        return;
      }

      // The letters leave THROUGH THE TOP of their own masks, in the order
      // they arrived and faster than they arrived, while the panel carries
      // them off the screen underneath. One direction for both, which is the
      // promise this component exists to keep. An exit that mirrored its
      // entrance would read as a rewind.
      const out = gsap.timeline({ onComplete: settle });
      if (letters.length > 0) {
        out.to(
          letters,
          {
            yPercent: -105,
            duration: LETTER_EXIT_MS / 1000,
            ease: 'power2.in',
            stagger: LETTER_EXIT_STEP_MS / 1000
          },
          0
        );
      }
      out.to(panel, { yPercent: -100, duration: revealMs / 1000, ease: 'power3.inOut' }, 0.08);
      tl.current = out;
    };

    revealRef.current = reveal;

    const covered = (): void => {
      if (phase.current !== 'covering') return;
      phase.current = 'holding';
      // The panel is shut, so the page underneath can be emptied without
      // anyone seeing it go. Everything the destination mounts behind this
      // is invisible until the uncover starts.
      raise('holding');

      const url = target.current;
      if (url === null) {
        reveal();
        return;
      }
      // Only now. See the note on the component.
      startTransition(() => {
        router.push(`${url.pathname}${url.search}${url.hash}`);
      });
    };

    const go = (url: URL, text: string): void => {
      if (phase.current !== 'idle') return;
      phase.current = 'covering';
      target.current = url;

      window.lenis?.stop();
      markRouted();
      raise('covering');
      panel.style.visibility = 'visible';
      panel.style.pointerEvents = 'auto';
      letters = splitInto(label, text);
      // The CAPS are a `text-transform`, so what this line hands a screen
      // reader is still the word as it was written. Announcing it is this
      // element's whole job — the panel itself is aria-hidden.
      status.textContent = text === '' ? 'Loading' : `Loading ${text}`;

      // Warm the destination while the panel is still closing, so the hold
      // at the end of the rise is as close to nothing as the network allows.
      router.prefetch(url.pathname);

      capTimer.current = window.setTimeout(() => {
        phase.current = 'holding';
        revealRef.current();
      }, HARD_CAP_MS);

      tl.current?.kill();
      if (reduced) {
        // Assembled rather than assembling — the same call the preloader
        // makes. Every letter travelling more than its own height is
        // precisely the movement the query is about, and there is no
        // shortened version of it worth showing.
        if (letters.length > 0) gsap.set(letters, { yPercent: 0 });
        nameRestAt = 0;
        tl.current = gsap
          .timeline({ onComplete: covered })
          .fromTo(panel, { yPercent: 0, opacity: 0 }, { opacity: 1, duration: 0.14, ease: 'none' });
        return;
      }

      // A FRACTION of the cover, so the word starts at the same point in the
      // sweep whatever --t-cover is set to. At 1 that point is the moment
      // the panel lands, which is the whole sequence: curtain, then name.
      const leadMs = coverMs * LETTER_LEAD;
      // No word, nothing to wait for. Without this the hold still ran the
      // full lead plus rise — measured at 708ms of a reader sitting behind
      // a blank panel while the curtain waited out a stagger that did not
      // exist. Every Link in the app carries a label now, so this should be
      // unreachable; it is here because "should be unreachable" is how that
      // 708ms got there in the first place.
      nameRestAt =
        letters.length === 0
          ? 0
          : performance.now() + leadMs + (letters.length - 1) * LETTER_STEP_MS + LETTER_RISE_MS;

      // `covered` hangs off the PANEL's own tween, not the timeline's
      // completion. The timeline outlives the panel by the tail of the
      // stagger, and hanging the push off the whole thing would hold the
      // route — and so the fetch — behind an animation the route has nothing
      // to do with.
      const cover = gsap
        .timeline()
        .fromTo(
          panel,
          { yPercent: 100 },
          { yPercent: 0, duration: coverMs / 1000, ease: 'power3.inOut', onComplete: covered },
          0
        );
      if (letters.length > 0) {
        cover.fromTo(
          letters,
          { yPercent: 105 },
          {
            yPercent: 0,
            duration: LETTER_RISE_MS / 1000,
            ease: 'power3.out',
            stagger: LETTER_STEP_MS / 1000
          },
          leadMs / 1000
        );
      }
      tl.current = cover;
    };

    const onClick = (event: MouseEvent): void => {
      // CAPTURE phase, and that is not a detail. next/link calls
      // preventDefault() on every internal href so it can route on the
      // client, and React's listener lives on the root container inside
      // document — so a bubble-phase listener here would find
      // defaultPrevented already true on exactly the links it exists to
      // catch, and silently never fire. Measured: the curtain stayed hidden
      // and the route changed in 73ms.
      //
      // Running first also means defaultPrevented still says something
      // useful, and that stopPropagation below can keep next/link from
      // navigating a second time underneath the curtain.
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute('download')) return;
      if (anchor.target !== '' && anchor.target !== '_self') return;

      const href = anchor.getAttribute('href');
      if (href === null || href === '') return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // Off-site, and mailto: / tel: — not ours to animate.
      if (url.origin !== window.location.origin) return;
      // Same page — and this is now the ONLY thing keeping the curtain off
      // the index's own #work / #about links, since running in
      // capture means useAnchorNav has not had its say yet. Leave the event
      // completely alone here: no preventDefault, no stopPropagation, so it
      // reaches that hook untouched.
      if (url.pathname === window.location.pathname) return;

      event.preventDefault();
      event.stopPropagation();
      go(url, anchor.dataset.transitionLabel ?? '');
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      window.clearTimeout(capTimer.current);
      window.clearTimeout(nameTimer.current);
      tl.current?.kill();
      tl.current = null;
      // An unmount mid-transition must not leave scrolling switched off —
      // nor leave the flag up, which would park every masked block on the
      // page for good.
      document.documentElement.removeAttribute(ROUTING_ATTR);
      window.lenis?.start();
    };
  }, [router]);

  // The rendezvous. `covered` starts the navigation; this is the other half
  // — the route has committed and rendered, so the panel can move on. Both
  // conditions matter: isPending alone flickers false between the push and
  // the commit on a cached route.
  useEffect(() => {
    if (phase.current !== 'holding') return;
    if (isPending) return;
    if (target.current !== null && target.current.pathname !== pathname) return;
    revealRef.current();
  }, [isPending, pathname]);

  return (
    <>
      <p ref={statusRef} className="sr-only" role="status" />

      {/* Ink, and the name of where you are going in paper. The inversion
          is not a new colour: ::selection has always drawn this site's type
          this way round, so the curtain is the page's own palette turned
          over for a second rather than a second palette.

          aria-hidden because the status line above says the same thing at
          the moment it becomes true, and says it once. */}
      <div
        ref={panelRef}
        aria-hidden="true"
        // inset-0, and do not "fix" this with w-screen. On a platform with
        // classic scrollbars the panel stops short of the right edge and a
        // pale strip shows — but that strip is the scrollbar itself, which
        // is browser chrome and sits above every element on the page.
        // `100vw` does not reach it either: `scrollbar-gutter: stable` on
        // <html> takes the gutter out of the viewport-percentage units too,
        // so w-screen measured 1425px on a 1440px window, exactly the same
        // as inset-0. Nothing to win, one more class to explain.
        className="st-curtain fixed inset-0 z-[150] flex items-center justify-center bg-[var(--ink)] px-[var(--gut)]"
      >
        {/* Centred, and therefore larger. In the bottom-left gutter this
            word was in the position type takes when it is a caption, and it
            was sized like one; in the middle of a full-bleed panel it is the
            only object on the screen, so it is set at display scale.

            The clamp FLOOR is what mattered, not the ceiling. The vw term
            takes over above about 486px, so every phone lands on the floor
            — and at the old 1.35rem the word measured 72.5px of ink in the
            middle of a 320x568 screen, which photographs as a caption that
            has wandered into the middle rather than as the subject. 1.75rem
            is 94px, still less than a third of the column.

            `uppercase` and `tracking-[0.04em]` are UTILITIES on purpose —
            Tailwind layers them after @layer components, so they beat
            .st-display's own -0.035em rather than losing to it (trap 1, read
            the right way round). Caps at a tracking cut for lowercase
            collide; positive tracking is what caps want.

            `leading-[normal]` is the one that matters most. .st-display
            sets 0.9, which is tighter than Nippo's ascent plus descent, so
            the glyphs hang outside their own box and a mask cut to that box
            shaves them — caps have no descenders, but Vietnamese caps carry
            diacritics ABOVE, which is the edge that gets cut. `normal` IS
            the face's own box, 1.269em for Nippo, so nothing can reach past
            the clip and no number here has to be kept in step with the font
            (trap 26). It is a utility and not a rule on .st-curtain-word
            because the two would be equal-specificity siblings, and source
            order is not a thing to hang a clip on.

            The transform is what makes them caps, not the string: the label
            the CMS holds stays lowercase, which is what the status line
            above announces and what `data-transition-label` still carries.

            Empty here. `splitInto` fills it with one clipped span per
            character at the start of every navigation and `settle` empties
            it again. */}
        <span
          ref={labelRef}
          className="st-curtain-word st-display whitespace-nowrap text-[clamp(1.75rem,5.4vw,3.6rem)] text-[var(--paper)] uppercase leading-[normal] tracking-[0.04em]"
        />
      </div>
    </>
  );
}
