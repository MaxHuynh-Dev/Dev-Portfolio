'use client';

import type React from 'react';
import { useEffect, useRef } from 'react';

/**
 * The spec sheet's column, which sticks — and can be taller than the room
 * it sticks in.
 *
 * It used to stick at a fixed offset under the top chrome, which is right
 * for as long as the sheet is shorter than the screen and quietly wrong
 * after that: the head stays in view and the foot, where "Visit the site"
 * is, sits under the bottom corner marks for the whole length of the shot
 * stack. Measured with the real project copy: Defiant's sheet ran 23px
 * past the room at 1366x768 and up to 126px at 1366x657, the viewport a
 * 1366x768 screen actually leaves a browser. That copy lives in the CMS,
 * so the length is not something a build can hold down.
 *
 * **This writes one number and decides nothing.** The column's own height
 * goes into `--pinned-h`; `.st-pinned` in global.css turns it into a `top`.
 * Nothing here reads the viewport or the chrome, so there is no second
 * opinion about either.
 *
 * It cannot feed back, and that was checked before it was written rather
 * than after (trap 8): the observer watches this box's height, and `top`
 * moves the box without resizing it.
 */
export default function PinnedColumn({
  className,
  children
}: {
  className: string;
  children: React.ReactNode;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;

    // A rect and not offsetHeight, which rounds to whole pixels (trap 25).
    const write = (): void => {
      element.style.setProperty('--pinned-h', `${element.getBoundingClientRect().height}px`);
    };

    write();
    const observer = new ResizeObserver(write);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`st-pinned ${className}`}>
      {children}
    </div>
  );
}
