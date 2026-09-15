'use client';

import { ImageWell } from '@Components/editorial/ImageWell';
import { MonoLabel } from '@Components/editorial/MonoLabel';
import { SectionHead } from '@Components/editorial/SectionHead';
import { PROJECTS } from '@Modules/EditorialHome/constants';
import type React from 'react';
import { useCallback, useRef, useState } from 'react';

/**
 * The project list. Hovering a row dims its siblings, slides it right, tints
 * the title, and summons a preview frame that tracks the cursor.
 *
 * Two deliberate departures from the source design:
 *  - Focus drives exactly the same state as hover, so the interaction is
 *    reachable by keyboard. The source was hover-only.
 *  - The preview is decorative and hidden from assistive tech; the row
 *    itself already carries the project's name and metadata.
 */
export const ProjectIndex = (): React.JSX.Element => {
  const [active, setActive] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Cursor tracking writes straight to the node — running this through state
  // would re-render the whole list on every mousemove. `translate` rather
  // than left/top: those are layout properties and would invalidate layout on
  // every pointer move. The independent `translate` property composes before
  // `transform`, so the centring transform below still applies.
  const handleMove = useCallback((event: React.MouseEvent) => {
    const node = previewRef.current;
    if (!node) return;
    node.style.translate = `${String(event.clientX)}px ${String(event.clientY)}px`;
  }, []);

  // Keyboard has no cursor, so anchor the preview to the focused row instead.
  const handleFocus = useCallback((event: React.FocusEvent<HTMLAnchorElement>, index: number) => {
    setActive(index);
    const node = previewRef.current;
    if (!node) return;
    const rect = event.currentTarget.getBoundingClientRect();
    node.style.translate = `${String(rect.right - rect.width * 0.2)}px ${String(rect.top + rect.height / 2)}px`;
  }, []);

  const clear = useCallback(() => {
    setActive(null);
  }, []);

  const activeProject = active === null ? null : PROJECTS[active];

  // The fade-out lasts 300ms; unmounting the image immediately would empty
  // the frame and *then* fade it. Hold the last one until the fade is done.
  const lastProject = useRef(activeProject);
  if (activeProject) lastProject.current = activeProject;
  const shownProject = activeProject ?? lastProject.current;

  return (
    <>
      <div
        ref={previewRef}
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 z-40 aspect-[4/5] w-[min(21rem,30vw)] overflow-hidden bg-[var(--ed-well)] transition-[opacity,transform] duration-300 ease-[cubic-bezier(.18,.82,.25,1)] max-[900px]:hidden"
        style={{
          opacity: activeProject ? 1 : 0,
          transform: `translate3d(-50%, -50%, 0) scale(${activeProject ? 1 : 0.94})`
        }}
      >
        {shownProject ? (
          <ImageWell
            src={shownProject.image}
            alt=""
            placeholder={shownProject.name}
            sizes="21rem"
          />
        ) : null}
      </div>

      <section
        id="index"
        aria-labelledby="index-head"
        className="relative z-[2] px-[var(--gut)] py-[clamp(3rem,7vw,6rem)]"
      >
        <SectionHead
          label="Index"
          headingId="index-head"
          meta={`${String(PROJECTS.length).padStart(2, '0')} projects`}
          ruled={false}
          className="ed-reveal"
        />

        <div className="ed-rule-t flex flex-col">
          {PROJECTS.map((project, index) => (
            <a
              key={project.no}
              href={project.href}
              onMouseEnter={() => {
                setActive(index);
              }}
              onMouseMove={handleMove}
              onMouseLeave={clear}
              onFocus={(event) => {
                handleFocus(event, index);
              }}
              onBlur={clear}
              className="ed-rule-b grid grid-cols-[3.4rem_minmax(0,1fr)_auto] items-center gap-x-[1.2rem] gap-y-[0.6rem] py-[clamp(0.9rem,2.2vw,1.5rem)] transition-[padding-left,opacity] duration-[450ms] ease-[cubic-bezier(.18,.82,.25,1)]"
              // Dimming the whole row put the 10px mono metadata at 1.97:1.
              // At 0.42 over #0A0A0A no colour can reach 4.5:1 — even pure
              // white tops out at 4.17 — so the dim moves onto the large
              // title alone, which passes the 3:1 large-text bar and carries
              // the visual weight of the effect anyway.
              style={{ paddingLeft: active === index ? '1.1rem' : '0' }}
            >
              <MonoLabel dim>{project.no}</MonoLabel>
              <span
                className="font-medium text-[clamp(1.5rem,4.4vw,3.4rem)] uppercase leading-none tracking-[-0.025em] transition-[color,opacity] duration-200"
                style={{
                  color: active === index ? 'var(--ed-accent)' : undefined,
                  opacity: active === null || active === index ? 1 : 0.42
                }}
              >
                {project.name}
              </span>
              <span className="flex flex-wrap justify-end gap-x-[0.9rem] gap-y-[0.35rem] text-right">
                <MonoLabel dim>{project.kind}</MonoLabel>
                <MonoLabel dim>{project.year}</MonoLabel>
              </span>
            </a>
          ))}
        </div>
      </section>
    </>
  );
};

export default ProjectIndex;
