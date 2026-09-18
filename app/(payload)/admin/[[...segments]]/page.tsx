import config from '@payload-config';
import { generatePageMetadata, RootPage } from '@payloadcms/next/views';
import type { Metadata } from 'next';
import type React from 'react';

import { importMap } from '../importMap.js';

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  return generatePageMetadata({ config, params, searchParams });
}

export default function Page({ params, searchParams }: Args): Promise<React.ReactElement> {
  return RootPage({ config, importMap, params, searchParams });
}
