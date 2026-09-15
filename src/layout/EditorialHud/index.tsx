'use client';

import { MonoLabel } from '@Components/editorial/MonoLabel';
import { useLocalClock } from '@Hooks/useLocalClock';
import { PROFILE } from '@Modules/EditorialHome/constants';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

const RESET_DELAY = 1400;

/**
 * Fixed bottom chrome: where the work happens, and how to start some.
 * The email is click-to-copy.
 */
function EditorialHud(): React.ReactElement {
  const time = useLocalClock(PROFILE.timeZone);
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The success state has to live inside the resolution. Announcing "copied"
  // unconditionally lies to a screen reader whenever the write is refused —
  // a non-secure origin (no navigator.clipboard at all), an unfocused
  // document, or a denied clipboard-write permission.
  const handleCopy = useCallback(() => {
    const write = navigator.clipboard?.writeText(PROFILE.email);
    if (!write) return;

    void write
      .then(() => {
        setCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
        }, RESET_DELAY);
      })
      .catch(() => {
        // Stays silent rather than claiming success; the mailto link in the
        // contact section is the reliable path.
      });
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return (
    // <footer> so the page exposes a contentinfo landmark; the scrim/blend
    // split matches EditorialHeader.
    <footer className="ed-chrome-scrim-bottom fixed right-0 bottom-0 left-0 z-[60] px-[var(--gut)] py-[1.1rem]">
      <div className="ed-chrome flex items-end justify-between gap-4">
        <div className="flex flex-col gap-[0.22rem]">
          <MonoLabel>{PROFILE.availability}</MonoLabel>
          <MonoLabel dim>
            {PROFILE.location}, <span suppressHydrationWarning>{time}</span>
          </MonoLabel>
        </div>

        <div className="flex flex-col items-end gap-[0.22rem]">
          <MonoLabel dim>For inquiries</MonoLabel>
          {/* The visible text is just an address; without this a screen reader
            user has no idea the control copies anything. The accessible name
            still contains the visible string, so 2.5.3 holds. */}
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? 'Email address copied' : `Copy email address ${PROFILE.email}`}
            className="ed-label m-0 cursor-pointer border-0 bg-transparent px-0 py-[0.3rem] normal-case transition-colors duration-200 hover:text-[var(--ed-accent)]"
          >
            {copied ? 'Copied' : PROFILE.email}
          </button>
          {/* The source design signalled success visually only. */}
          <span aria-live="polite" className="sr-only">
            {copied ? `${PROFILE.email} copied to clipboard` : ''}
          </span>
        </div>
      </div>
    </footer>
  );
}

export default EditorialHud;
