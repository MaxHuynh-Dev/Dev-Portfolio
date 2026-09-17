'use client';

import Shot from '@Components/Shot';
import { useFittedText } from '@Hooks/useFittedText';
import Image from 'next/image';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Project } from '@/content/site';

const RATIO = { wide: '16 / 10', tall: '4 / 5' } as const;

/**
 * The media column, and the rail beside it.
 *
 * They are one component because they share a single piece of state — which
 * shot is currently at eye level — and splitting them across the layout
 * would mean lifting that into a context for two consumers.
 *
 * The rail is a real navigation control, not a progress decoration: each
 * thumbnail is a button that scrolls to its shot, and the current one
 * carries aria-current as well as an outline, so the state is not carried
 * by appearance alone.
 */
export default function ShotStack({ project }: { project: Project }): React.ReactElement {
  const [active, setActive] = useState(0);
  const stackRef = useRef<HTMLDivElement>(null);

  // The project name, fitted to the media column rather than guessed at
  // with a clamp. Names here run from four characters to thirty, and a
  // fixed scale is either timid for the short ones or overflowing for the
  // long ones. Same engine as the masthead.
  const { ref: nameRef } = useFittedText(project.name, { maxViewportFraction: 0.3 });

  useEffect(() => {
    const figures = Array.from(
      stackRef.current?.querySelectorAll<HTMLElement>('[data-shot]') ?? []
    );
    if (figures.length === 0) return;

    let frame = 0;

    const measure = (): void => {
      frame = 0;
      const middle = window.innerHeight / 2;
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let index = 0; index < figures.length; index += 1) {
        const box = figures[index].getBoundingClientRect();
        const distance = Math.abs(box.top + box.height / 2 - middle);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = index;
        }
      }
      setActive(best);
    };

    const schedule = (): void => {
      if (frame !== 0) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const goTo = (index: number): void => {
    const target = stackRef.current?.querySelector<HTMLElement>(`[data-shot="${index}"]`);
    if (!target) return;
    // Lenis does not honour scroll-padding-top; read the declared value so
    // the two cannot drift.
    const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    if (window.lenis) {
      window.lenis.scrollTo(target, { offset: -padding });
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex min-w-0 flex-1 gap-[clamp(0.75rem,2vw,2rem)]">
      <div ref={stackRef} className="min-w-0 flex-1">
        {/* The name sits over the first shot. It is the page's h1: the
            spec sheet above it is supporting material, and a heading this
            size pretending to be decorative while a hidden one carries the
            outline would be the worse arrangement. */}
        <h1
          ref={nameRef as React.RefObject<HTMLHeadingElement>}
          className="st-display st-fit relative z-10 m-0 whitespace-nowrap text-[var(--ink)]"
        >
          {project.name}
        </h1>

        <div className="mt-[-0.22em] flex flex-col gap-[clamp(2rem,6vw,5rem)]">
          {project.shots.map((shot, index) => (
            <figure
              // biome-ignore lint/suspicious/noArrayIndexKey: shots are positional, and two may share a src of null
              key={index}
              data-shot={index}
              className="m-0"
            >
              <Shot
                src={shot.src}
                alt={shot.alt}
                ratio={shot.tall === true ? RATIO.tall : RATIO.wide}
                label={`shot ${String(index + 1).padStart(2, '0')}, ${shot.tall === true ? '4:5' : '16:10'}`}
                sizes="(max-width: 60rem) 100vw, 46rem"
                priority={index === 0}
              />
            </figure>
          ))}
        </div>
      </div>

      {/* Below md the rail would be smaller than a touch target and would
          steal width the shots need. */}
      <nav aria-label="Shots" className="hidden shrink-0 md:block">
        <ol className="sticky top-[24vh] m-0 flex list-none flex-col gap-[0.4rem] p-0">
          {project.shots.map((shot, index) => (
            <li
              // biome-ignore lint/suspicious/noArrayIndexKey: shots are positional
              key={index}
            >
              <button
                type="button"
                aria-current={index === active ? 'true' : undefined}
                aria-label={`Shot ${index + 1} of ${project.shots.length}`}
                onClick={() => {
                  goTo(index);
                }}
                style={{ aspectRatio: shot.tall === true ? RATIO.tall : RATIO.wide }}
                className="relative block w-[2.4rem] bg-[var(--well)] outline-offset-2 focus-visible:outline-2 focus-visible:outline-[var(--ink)] aria-[current]:outline-2 aria-[current]:outline-[var(--ink)]"
              >
                {shot.src !== null ? (
                  <Image src={shot.src} alt="" fill sizes="48px" className="object-cover" />
                ) : null}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
