"use client";

import Link from "next/link";
import type React from "react";
import type { Project } from "@/content/site";
import {
  ROW_FALL_MS,
  ROW_FALL_STAGGER_MS,
  ROW_LEAD_MS,
  ROW_RISE_MS,
  ROW_STAGGER_MS,
} from "./timing";

/**
 * The same projects, as a plain list.
 *
 * The ring is a good way to look at covers and a poor way to read eight
 * names at once, so it is not the only way in. This is also the view that
 * answers the ring's one real cost: it takes the wheel away from the reader
 * for as long as they are on it.
 *
 * Every cell sits in its own mask and rises out of it, one row after the
 * next, while the covers gather into the slot beside them. The rise is a
 * plain CSS transition keyed off `data-in` rather than a timeline: nothing
 * writes these transforms per frame, there is only ever one target pose,
 * and the reduced-motion block flattens it to nothing without this file
 * having to ask.
 *
 * The row's timing is inline because it is per-row — but `.st-reveal-line`
 * transitions `transform` ONLY, so the inline duration and delay cannot
 * reach the colour. Before that they did, and the dim-to-ink on hover
 * inherited the row's stagger: pointing at the seventh row lit it up half a
 * second later.
 *
 * Only the name dims. The number and the metadata beside it stay at full
 * --ink-2, because dimming a whole row takes the readout down with the
 * title it is meant to be explaining.
 *
 * --ink-2 and not --ink-3: these rows are not display-sized. At 320 the
 * name computes to about 17px, under the 18.66px where bold type counts as
 * large, so the bar is 4.5:1 — which --ink-3 (3.88:1) fails and --ink-2
 * (5.05:1) clears.
 */

/** The cells of one row all move together; the rows are what stagger. */
const timing = (index: number, shown: boolean): React.CSSProperties => ({
  transitionDuration: `${shown ? ROW_RISE_MS : ROW_FALL_MS}ms`,
  transitionDelay: `${shown ? ROW_LEAD_MS + index * ROW_STAGGER_MS : index * ROW_FALL_STAGGER_MS}ms`,
});

export default function Roll({
  projects,
  active,
  shown,
  onActive,
}: {
  projects: Project[];
  active: number;
  /** True once the list is the view being asked for. Drives the rise. */
  shown: boolean;
  onActive: (index: number) => void;
}): React.ReactElement {
  return (
    <ol data-in={shown} className="m-0 list-none p-0">
      {projects.map((project, index) => {
        const pose = timing(index, shown);
        return (
          <li key={project.slug}>
            <Link
              href={`/work/${project.slug}`}
              data-transition-label={project.name}
              onMouseEnter={() => {
                onActive(index);
              }}
              onFocus={() => {
                onActive(index);
              }}
              className="grid grid-cols-[2.2rem_minmax(0,1fr)_auto] items-baseline gap-x-[0.75rem] py-[clamp(0.1rem,0.55vh,0.45rem)]"
            >
              <span className="st-reveal">
                <span
                  className="st-reveal-line st-meta tabular-nums"
                  style={pose}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </span>

              {/* The colour lives on the mask, not the line, so it is free of
                  the line's per-row timing and fades on its own 300ms. */}
              <span
                className="st-reveal transition-colors duration-300"
                style={{
                  color: index === active ? "var(--ink)" : "var(--ink-2)",
                }}
              >
                <span
                  className="st-reveal-line st-display text-[clamp(1rem,2.4vw,1.5rem)]"
                  style={pose}
                >
                  {project.name}
                </span>
              </span>

              <span className="st-reveal">
                <span
                  className="st-reveal-line st-meta whitespace-nowrap"
                  style={pose}
                >
                  {project.kind.toLowerCase()},{" "}
                  <span className="tabular-nums">{project.year}</span>
                </span>
              </span>

              {/* The readout above this list and the cover beside it are both
                  visual echoes and both hidden, so the one line describing
                  the project has to live in the link's own accessible name
                  or it reaches nobody. */}
              <span className="sr-only">. {project.summary}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
