import NotFoundView from '@Modules/NotFound';
import type { Metadata } from 'next';
import type React from 'react';

// The layout's template turns this into "Not found | Name". Next adds
// `noindex` to every 404 by itself.
export const metadata: Metadata = { title: 'Not found' };

export default function NotFound(): React.ReactElement {
  return <NotFoundView />;
}
