'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import dynamic from 'next/dynamic';
import type React from 'react';
import type { PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

import { ACCENT } from './constants';

gsap.registerPlugin(ScrollTrigger, useGSAP);

// three.js is ~150KB gzipped and the page is fully readable without it, so
// it stays out of the initial bundle and never runs on the server.
const Stage = dynamic(() => import('./Stage').then((m) => m.default), { ssr: false });

/** The design hides the stage entirely below this width. */
const STAGE_QUERY = '(min-width: 900px)';

/**
 * The page's only client boundary.
 *
 * It owns the fixed backdrop layers, the scroll reveals and the WebGL gate,
 * and takes the sections as children — so those stay server components and
 * never ship to the browser. Same pattern MainLayout uses for SmoothScroll.
 */
export default function Shell({ children }: PropsWithChildren): React.ReactElement {
  const root = useRef<HTMLDivElement>(null);

  // Gating the mount, not just hiding it in CSS: a display:none container
  // still mounts the component, downloads the three.js chunk and allocates a
  // GPU context. Phones would pay all of that for something never painted.
  const [stageEnabled, setStageEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(STAGE_QUERY);
    const apply = (): void => {
      setStageEnabled(query.matches);
    };
    apply();
    query.addEventListener('change', apply);
    return () => {
      query.removeEventListener('change', apply);
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          motion: '(prefers-reduced-motion: no-preference)',
          reduced: '(prefers-reduced-motion: reduce)'
        },
        (context) => {
          const { reduced } = context.conditions as { motion: boolean; reduced: boolean };
          const targets = gsap.utils.toArray<HTMLElement>('.ed-reveal');
          if (targets.length === 0) return;

          if (reduced) {
            gsap.set(targets, { opacity: 1, y: 0 });
            return;
          }

          for (const target of targets) {
            gsap.fromTo(
              target,
              { opacity: 0, y: '1.4rem' },
              {
                opacity: 1,
                y: 0,
                duration: 0.9,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: target,
                  // Matches the source design's -12% root margin.
                  start: 'top 88%',
                  once: true
                }
              }
            );
          }
        }
      );
    },
    { scope: root }
  );

  return (
    <div ref={root} className="relative bg-[var(--ed-bg)] text-[var(--ed-fg)]">
      {/* Layer 0 — WebGL backdrop, then a vignette to sink it behind the type. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 animate-[ed-stage-in_1.4s_ease_.35s_both] overflow-hidden max-[900px]:hidden"
      >
        {stageEnabled ? <Stage accent={ACCENT} /> : null}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 [background:radial-gradient(58%_52%_at_50%_50%,rgba(10,10,10,0.18)_0%,rgba(10,10,10,0.72)_62%,rgba(10,10,10,0.9)_100%)]"
      />

      {/* Layer 1 — the four-column rule overlay that gives the page its measure. */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1] opacity-50 [background-image:linear-gradient(to_right,var(--ed-grid)_1px,transparent_1px)] [background-size:calc(100%/4)_100%]"
      />

      {children}
    </div>
  );
}
