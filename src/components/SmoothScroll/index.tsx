'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type React from 'react';
import { useEffect, useRef } from 'react';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({
  children
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true
    });

    lenisRef.current = lenis;
    // biome-ignore lint/suspicious/noExplicitAny: global assignment for section scroll controls
    window.lenis = lenis as any;

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    // Run Lenis tick on GSAP ticker
    const updateTicker = (time: number): void => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);

    gsap.ticker.lagSmoothing(0);

    // Clean up
    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateTicker);
      window.lenis = undefined;
    };
  }, []);

  return <>{children}</>;
}
