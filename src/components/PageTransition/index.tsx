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
    gsap.set(label, { opacity: 0 });

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
      // Parked below the fold again, ready for the next one.
      gsap.set(panel, { yPercent: 100, opacity: 1 });
      gsap.set(label, { opacity: 0 });
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

      tl.current = gsap
        .timeline({ onComplete: settle })
        .to(label, { opacity: 0, duration: 0.18, ease: 'none' }, 0)
        .to(panel, { yPercent: -100, duration: revealMs / 1000, ease: 'power3.inOut' }, 0.06);
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
      label.textContent = text;
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
        tl.current = gsap
          .timeline({ onComplete: covered })
          .fromTo(panel, { yPercent: 0, opacity: 0 }, { opacity: 1, duration: 0.14, ease: 'none' });
        return;
      }

      tl.current = gsap
        .timeline({ onComplete: covered })
        .fromTo(
          panel,
          { yPercent: 100 },
          { yPercent: 0, duration: coverMs / 1000, ease: 'power3.inOut' },
          0
        )
        .fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.26, ease: 'none' }, 0.24);
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
      // the index's own #work / #about / #contact links, since running in
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
        className="st-curtain fixed inset-0 z-[150] flex flex-col justify-end bg-[var(--ink)] px-[var(--gut)] pb-[var(--gut)]"
      >
        <span
          ref={labelRef}
          className="st-display whitespace-nowrap text-[clamp(1.15rem,4.6vw,3.2rem)] text-[var(--paper)] opacity-0"
        />
      </div>
    </>
  );
}
