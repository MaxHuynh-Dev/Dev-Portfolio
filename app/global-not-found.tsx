import '@Styles/global.css';

import { nippo, switzer } from '@Constants/fonts';
import NotFoundView from '@Modules/NotFound';
import type { Metadata } from 'next';
import type React from 'react';

/**
 * A URL that matches no route at all. This app has two root layouts — the
 * site's and Payload's — so there is no single layout to compose a 404 from,
 * which is the case Next's `global-not-found` exists for (enabled by
 * `experimental.globalNotFound` in next.config.ts). It skips every layout,
 * so it brings its own stylesheet and fonts; it has no preloader, no route
 * curtain and no corner marks, just the page.
 */
export const metadata: Metadata = {
  title: 'Not found',
  description: 'There is no page at this address.'
};

export default function GlobalNotFound(): React.ReactElement {
  return (
    <html lang="en">
      <body className={`${nippo.variable} ${switzer.variable}`}>
        <main id="content">
          <NotFoundView />
        </main>
      </body>
    </html>
  );
}
