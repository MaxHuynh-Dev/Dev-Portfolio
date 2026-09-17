'use client';

import { useCallback } from 'react';

/**
 * Anchor navigation routed through Lenis.
 *
 * The page deliberately omits `scroll-behavior: smooth` (it fights Lenis),
 * so in-page links have to be driven explicitly. Falls back to native
 * scrolling when Lenis has not mounted.
 */
export function useAnchorNav(): (event: React.MouseEvent<HTMLAnchorElement>, href: string) => void {
  return useCallback((event: React.MouseEvent<HTMLAnchorElement>, href: string): void => {
    if (!href.startsWith('#')) return;

    // Let the browser handle modifier-clicks so "open in new tab" still works.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const target = document.getElementById(href.slice(1));
    if (!target) return;

    event.preventDefault();

    // preventDefault cancels the whole navigate-to-fragment step, not just the
    // jump — so the hash never updates AND the browser never moves the
    // sequential focus starting point. Without the focus() below, activating
    // a nav link scrolls the page while the keyboard user stays on the link
    // and a screen reader's cursor never moves: the nav is decorative.
    window.history.pushState(null, '', href);
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });

    if (window.lenis) {
      // Lenis does not honour scroll-padding-top — that property only
      // applies to the browser's own scroll-into-view. Without this the
      // fixed corner marks land on top of the section heading every time
      // the nav is used. Read the declared value rather than repeating it,
      // so the two can never drift.
      const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      window.lenis.scrollTo(target, { offset: -padding });
      return;
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  }, []);
}
