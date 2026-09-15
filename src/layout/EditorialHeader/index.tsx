'use client';

import { MonoLabel } from '@Components/editorial/MonoLabel';
import { ROUTER } from '@Constants/router';
import { useAnchorNav } from '@Hooks/useAnchorNav';
import { PROFILE } from '@Modules/EditorialHome/constants';
import type React from 'react';

/**
 * Fixed top chrome.
 *
 * The outer element paints an opaque scrim and is NOT blended; only the inner
 * wrapper carries `mix-blend-mode: difference`. Blending against an arbitrary
 * backdrop hits a null point wherever the backdrop is half the text value —
 * over the #141414 image wells the labels genuinely disappear.
 */
function EditorialHeader(): React.ReactElement {
  const onAnchorClick = useAnchorNav();

  return (
    <header className="ed-chrome-scrim-top fixed top-0 right-0 left-0 z-[60] px-[var(--gut)] py-[1.1rem]">
      <div className="ed-chrome flex items-start justify-between gap-4">
        {/* biome-ignore lint/a11y/useValidAnchor: real in-page navigation, intercepted only to route through Lenis */}
        <a
          href="#top"
          onClick={(event) => {
            onAnchorClick(event, '#top');
          }}
          className="flex flex-col gap-[0.2rem]"
        >
          <MonoLabel>
            {PROFILE.firstName} {PROFILE.lastName}
          </MonoLabel>
          <MonoLabel dim>{PROFILE.role}</MonoLabel>
        </a>

        {/* gap-0 with vertical padding on each link: the type sits exactly
            where it did, but the hit boxes grow from 12px to ~24px so target
            centres clear the 24px minimum (WCAG 2.5.8). */}
        <nav aria-label="Sections" className="flex flex-col items-end gap-0">
          {ROUTER.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(event) => {
                onAnchorClick(event, item.href);
              }}
              className="ed-label py-[0.4rem] transition-colors duration-200 hover:text-[var(--ed-accent)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default EditorialHeader;
