/* THIS FILE WAS GENERATED AGAINST THE PAYLOAD 3 ADMIN SCAFFOLD.
 * It is the second ROOT layout in this app: `app/(frontend)/layout.tsx`
 * is the first, and there is deliberately no `app/layout.tsx` above
 * either of them. Two root layouts in two route groups is a supported
 * arrangement (see Next's route-groups doc) and the only cost is that
 * moving between /admin and the site is a full page load — which is
 * correct here, since the admin has no business inheriting the site's
 * preloader, its scroll smoothing or its route curtain.
 */
import config from '@payload-config';
import '@payloadcms/next/css';
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts';
import type { ServerFunctionClient } from 'payload';
import type React from 'react';

import { importMap } from './admin/importMap.js';

type Args = {
  children: React.ReactNode;
};

const serverFunction: ServerFunctionClient = async function serverFunction(args) {
  'use server';
  return handleServerFunctions({
    ...args,
    config,
    importMap
  });
};

export default function Layout({ children }: Args): React.ReactElement {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
