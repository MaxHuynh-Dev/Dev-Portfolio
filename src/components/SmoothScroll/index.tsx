'use client';

import gsap from 'gsap';
import Lenis from 'lenis';
import type React from 'react';
import { useEffect, useRef } from 'react';

export default function SmoothScroll({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Lenis was the one motion source ignoring this, and 1.2s of eased
    // inertia on every wheel tick is the largest piece of vestibular motion
    // on the page. Every `lenis.scrollTo` caller falls back to native
    // scrolling when window.lenis is absent, so opting out is safe.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true
    });

    lenisRef.current = lenis;
    window.lenis = lenis;

    // Lenis runs on GSAP's ticker, so the curtains' tweens and the scroll
    // advance on the same frame. There is no ScrollTrigger: nothing on the
    // site uses it — every scroll-driven piece reads plain scroll events
    // (trap 3) — and it was 18KB plus an update on every scroll, shipped
    // to every route for nothing.
    const updateTicker = (time: number): void => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateTicker);
      window.lenis = undefined;
    };
  }, []);

  return <>{children}</>;
}
