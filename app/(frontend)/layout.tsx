import '@Styles/global.css';

import { PRELOADER_BOOT_SCRIPT } from '@Components/Preloader/boot';
import { nippo, switzer } from '@Constants/fonts';
import { buildDefaultMetadata } from '@Constants/metadata';
import MainLayout from '@Layout/MainLayout';
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import type React from 'react';

export function generateMetadata(): Promise<Metadata> {
  return buildDefaultMetadata();
}

export const viewport: Viewport = {
  themeColor: '#efedea',
  colorScheme: 'light'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    // The boot script below sets data-preloading on <html> before React
    // hydrates, which React reports as an un-patchable attribute mismatch.
    // The divergence is deliberate and one attribute wide.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Required for scroll restoration control
          dangerouslySetInnerHTML={{
            __html: `history.scrollRestoration = 'manual'`
          }}
        />
        {/* Decides, before the body paints, whether this session gets a
            curtain and whether the page's load animations are held. Doing
            it in React would cost a visible frame either way. */}
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: must run before first paint
          dangerouslySetInnerHTML={{
            __html: PRELOADER_BOOT_SCRIPT
          }}
        />
        {/* React Scan, while developing and never otherwise. NODE_ENV and
            not NEXT_PUBLIC_APP_ENV: the latter defaults to `development`
            when the variable is unset, so one missing setting on Vercel
            would have put an unpinned third-party script, with the page's
            full privileges, on the live site. Pinned to a version for the
            same reason. */}
        {process.env.NODE_ENV === 'development' && (
          <Script src="https://unpkg.com/react-scan@0.4.3/dist/auto.global.js" />
        )}
      </head>
      <body className={`${nippo.variable} ${switzer.variable}`}>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
