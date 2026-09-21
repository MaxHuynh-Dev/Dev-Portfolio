import GridDebug from '@Components/GridDebug';
import PageTransition from '@Components/PageTransition';
import Preloader from '@Components/Preloader';
import SmoothScroll from '@Components/SmoothScroll';
import Corners from '@Modules/Studio/Corners';
import { uiHelper } from '@Utils/uiHelper';
import type React from 'react';
import type { PropsWithChildren } from 'react';
import { getFullName, getProfile } from '@/content/source';

/**
 * The frame every page sits in.
 *
 * It reads the profile here rather than letting the two leaves below reach
 * for it themselves, because both of them are client components and the
 * read layer pulls in Payload, the Mongo adapter and sharp. A server
 * component fetching once and handing down is the same rule trap 5 states
 * for state: the client boundaries are leaves.
 *
 * The name is built in ONE place and passed to both the corner marks and
 * the preloader, which matters more than it looks: the curtain assembles
 * its own copy of the masthead letter by letter and hands it over exact to
 * the pixel, and a handover between two independently-derived strings is a
 * coincidence waiting to stop being true.
 */
export default async function MainLayout({
  children
}: PropsWithChildren): Promise<React.ReactElement> {
  const [profile, fullName] = await Promise.all([getProfile(), getFullName()]);

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
      <Corners profile={profile} />

      {/* tabindex so PageTransition can move focus here after a
          navigation, and so the skip link above lands somewhere. */}
      <main id="content" tabIndex={-1}>
        {children}
      </main>

      {/* Dev-only: it registers a global keydown listener and writes to
          localStorage — no reason to ship either. */}
      {uiHelper.isDevelopment() && <GridDebug />}

      {/* The route curtain. Below the preloader in the DOM and in z-index,
          because the two never run at the same time and the preloader must
          win if they ever do. */}
      <PageTransition />

      {/* Last in the DOM so it sits above the chrome without fighting it,
          and so it stays out of the tab order ahead of the skip link. It
          marks everything above inert while it runs. */}
      <Preloader fullName={fullName} />
    </SmoothScroll>
  );
}
