import GridDebug from '@Components/GridDebug';
import SmoothScroll from '@Components/SmoothScroll';
import EditorialHeader from '@Layout/EditorialHeader';
import EditorialHud from '@Layout/EditorialHud';
import { uiHelper } from '@Utils/uiHelper';
import type React from 'react';
import type { PropsWithChildren } from 'react';

export default function MainLayout({ children }: PropsWithChildren): React.ReactElement {
  return (
    <SmoothScroll>
      {/* Bypass block: the header nav plus the index put 20+ links ahead of
          the content for keyboard and screen-reader users. */}
      <a href="#content" className="ed-skip sr-only">
        Skip to content
      </a>

      <EditorialHeader />

      <main id="content">{children}</main>

      {/* The editorial design has no footer band — the HUD and the contact
          section carry what a footer normally would. */}
      <EditorialHud />

      {/* Dev-only: it registers a global keydown listener and writes to
          localStorage — no reason to ship either. */}
      {uiHelper.isDevelopment() && <GridDebug />}
    </SmoothScroll>
  );
}
