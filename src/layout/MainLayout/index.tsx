import GridDebug from '@Components/GridDebug';
import Preloader from '@Components/Preloader';
import SmoothScroll from '@Components/SmoothScroll';
import Corners from '@Modules/Studio/Corners';
import { uiHelper } from '@Utils/uiHelper';
import type React from 'react';
import type { PropsWithChildren } from 'react';

export default function MainLayout({ children }: PropsWithChildren): React.ReactElement {
  return (
    <SmoothScroll>
      {/* Bypass block: the corner marks put a dozen links ahead of the
          content for keyboard and screen-reader users. */}
      <a href="#content" className="st-skip sr-only">
        Skip to content
      </a>

      {/* All page chrome, at the four edges. There is no header band and no
          footer band — the corner marks and the contact section carry what
          those normally would. */}
      <Corners />

      <main id="content">{children}</main>

      {/* Dev-only: it registers a global keydown listener and writes to
          localStorage — no reason to ship either. */}
      {uiHelper.isDevelopment() && <GridDebug />}

      {/* Last in the DOM so it sits above the chrome without fighting it,
          and so it stays out of the tab order ahead of the skip link. It
          marks everything above inert while it runs. */}
      <Preloader />
    </SmoothScroll>
  );
}
