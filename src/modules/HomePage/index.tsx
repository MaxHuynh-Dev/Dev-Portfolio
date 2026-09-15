'use client';

import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type React from 'react';
import { useRef } from 'react';

// Import Section Components
import { About } from './About';
import { Contact } from './Contact';
import { Experience } from './Experience';
import { Hero } from './Hero';
import { Projects } from './Projects';
import { SkillsMarquee } from './SkillsMarquee';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

function HomePage(): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerLineRef = useRef<HTMLDivElement>(null);
  const timelineSvgRef = useRef<SVGSVGElement>(null);
  const timelinePathRef = useRef<SVGPathElement>(null);

  const cursorContainerRef = useRef<HTMLDivElement>(null);
  const glow1Ref = useRef<HTMLDivElement>(null);
  const glow2Ref = useRef<HTMLDivElement>(null);

  // GSAP animations for timeline and visual effects
  useGSAP(
    (context, _contextSafe) => {
      // 1. Hero visual load animations
      const heroTl = gsap.timeline();
      heroTl.fromTo(
        '.hero-title span',
        { y: '105%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 1.2, stagger: 0.15, ease: 'power4.out' }
      );
      heroTl.fromTo(
        '.hero-sub, .hero-cta',
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.2 },
        '-=0.6'
      );
      heroTl.fromTo(
        '.hero-card',
        { scale: 0.9, opacity: 0, rotateX: 20, rotateY: -20 },
        { scale: 1, opacity: 1, rotateX: 0, rotateY: 0, duration: 1.4, ease: 'power3.out' },
        '-=0.8'
      );

      // 2. Setup quickTo for mouse follower glows
      if (glow1Ref.current && glow2Ref.current) {
        // Set initial positions
        gsap.set([glow1Ref.current, glow2Ref.current], {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        });

        const xTo1 = gsap.quickTo(glow1Ref.current, 'x', { duration: 0.4, ease: 'power3' });
        const yTo1 = gsap.quickTo(glow1Ref.current, 'y', { duration: 0.4, ease: 'power3' });
        const xTo2 = gsap.quickTo(glow2Ref.current, 'x', { duration: 0.6, ease: 'power3' });
        const yTo2 = gsap.quickTo(glow2Ref.current, 'y', { duration: 0.6, ease: 'power3' });

        const onMouseMove = (e: MouseEvent): void => {
          xTo1(e.clientX);
          yTo1(e.clientY);
          xTo2(e.clientX);
          yTo2(e.clientY);
        };

        window.addEventListener('mousemove', onMouseMove, { passive: true });

        context.add(() => {
          window.removeEventListener('mousemove', onMouseMove);
        });
      }

      // 3. Timeline SVG Path Drawing on Scroll
      const path = timelinePathRef.current;
      if (path && timelineSvgRef.current) {
        const pathLength = path.getTotalLength();
        gsap.set(path, { strokeDasharray: pathLength, strokeDashoffset: pathLength });

        gsap.to(path, {
          strokeDashoffset: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: triggerLineRef.current,
            start: 'top 60%',
            end: 'bottom 60%',
            scrub: true
          }
        });
      }

      // 4. Experience items fade on scroll
      const items = gsap.utils.toArray<HTMLElement>('.timeline-item');
      for (const item of items) {
        gsap.fromTo(
          item,
          { opacity: 0, x: -30 },
          {
            opacity: 1,
            x: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: item,
              start: 'top 80%',
              end: 'top 50%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      // 5. Scroll progress indicator dot
      const dots = gsap.utils.toArray<HTMLElement>('.timeline-dot');
      for (const dot of dots) {
        gsap.fromTo(
          dot,
          { scale: 0, backgroundColor: '#161426' },
          {
            scale: 1,
            backgroundColor: '#8b5cf6',
            boxShadow: '0 0 10px #8b5cf6',
            scrollTrigger: {
              trigger: dot,
              start: 'top 60%',
              toggleActions: 'play none none reverse'
            }
          }
        );
      }

      // 6. Scroll-triggered reveal-word headings
      const revealContainers = gsap.utils.toArray<HTMLElement>('.reveal-container');
      for (const container of revealContainers) {
        const words = container.querySelectorAll('.reveal-word');
        gsap.to(words, {
          y: '0%',
          duration: 1,
          stagger: 0.03,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: container,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        });
      }

      // 7. Awwwards Stacking Cards Animation (Desktop Only)
      const projectCards = gsap.utils.toArray<HTMLElement>('.project-card');
      const mm = gsap.matchMedia();
      mm.add('(min-width: 768px)', () => {
        // Set explicit initial properties to avoid parsing discrepancies
        gsap.set(projectCards, { scale: 1, opacity: 1, filter: 'brightness(1)' });

        projectCards.forEach((card, i) => {
          if (i === projectCards.length - 1) return; // The last card doesn't scale down

          // Create a single timeline for this card to prevent overlapping tween conflicts
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: projectCards[i + 1], // Start animating when the next card scrolls up
              start: 'top 85%',
              endTrigger: projectCards[projectCards.length - 1], // Finish when the last card is stuck
              end: `top ${String(100 + (projectCards.length - 1) * 40)}px`,
              scrub: true
            }
          });

          // Add progressive stacking steps to the timeline
          for (let j = i + 1; j < projectCards.length; j++) {
            const depth = j - i;
            const targetScale = 1 - depth * 0.04;
            const targetOpacity = 1 - depth * 0.15;
            const targetBrightness = 1 - depth * 0.15;

            tl.to(card, {
              scale: targetScale,
              opacity: targetOpacity,
              filter: `brightness(${targetBrightness})`,
              ease: 'none',
              duration: 1
            });
          }
        });
      });
    },
    { scope: containerRef }
  );

  // Quick opacity transitions for cursor on hover (direct DOM update, no react state re-renders!)
  const handleMouseEnter = (): void => {
    if (cursorContainerRef.current) {
      gsap.to(cursorContainerRef.current, { opacity: 0.35, duration: 0.3 });
    }
  };

  const handleMouseLeave = (): void => {
    if (cursorContainerRef.current) {
      gsap.to(cursorContainerRef.current, { opacity: 0.2, duration: 0.3 });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen overflow-x-clip bg-[#05040a] text-zinc-100"
    >
      {/* ─── Creative Custom Magnetic Cursor Backdrop ─── */}
      <div
        ref={cursorContainerRef}
        className="pointer-events-none fixed inset-0 z-0 hidden opacity-20 transition-opacity duration-300 md:block"
      >
        <div
          ref={glow1Ref}
          className="absolute top-0 left-0 -mt-[250px] -ml-[250px] h-[500px] w-[500px] rounded-full bg-[#8b5cf6] opacity-15 blur-[120px] will-change-transform"
        />
        <div
          ref={glow2Ref}
          className="absolute top-0 left-0 -mt-[150px] -ml-[150px] h-[300px] w-[300px] rounded-full bg-[#06b6d4] opacity-20 blur-[90px] will-change-transform"
        />
      </div>

      {/* ═══════════════════ SECTION COMPONENTS ═══════════════════ */}
      <Hero onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} />

      <SkillsMarquee />

      <About />

      <Projects />

      <Experience
        triggerLineRef={triggerLineRef}
        timelineSvgRef={timelineSvgRef}
        timelinePathRef={timelinePathRef}
      />

      <Contact />
    </div>
  );
}

export default HomePage;
