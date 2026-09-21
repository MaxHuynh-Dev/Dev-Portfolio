"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import type React from "react";
import { useEffect, useRef } from "react";

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Lenis was the one motion source ignoring this, and 1.2s of eased
    // inertia on every wheel tick is the largest piece of vestibular motion
    // on the page. useAnchorNav already falls back to native scrolling when
    // window.lenis is absent, so opting out here is safe end to end.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    lenisRef.current = lenis;
    window.lenis = lenis;

    // Connect Lenis to GSAP ScrollTrigger
    lenis.on("scroll", () => {
      ScrollTrigger.update();
    });

    // Run Lenis tick on GSAP ticker
    const updateTicker = (time: number): void => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(updateTicker);

    gsap.ticker.lagSmoothing(0);

    // Webfonts swap in after first paint and reflow the page, which
    // invalidates every start/end position ScrollTrigger has already cached.
    // Without this, reveals below the fold fire at the wrong scroll offset.
    let cancelled = false;
    void document.fonts.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });

    // Clean up
    return () => {
      cancelled = true;
      lenis.destroy();
      gsap.ticker.remove(updateTicker);
      window.lenis = undefined;
    };
  }, []);

  return <>{children}</>;
}
