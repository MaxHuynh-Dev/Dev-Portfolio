import config from '@payload-config';
import { NotFoundPage } from '@payloadcms/next/views';
import type { Metadata } from 'next';
import type React from 'react';

import { importMap } from '../importMap.js';

type Args = {
  params: Promise<{ segments: string[] }>;
  searchParams: Promise<Record<string, string | string[]>>;
};

export function generateMetadata(_args: Args): Metadata {
  return { title: 'Not found' };
}

export default function NotFound({ params, searchParams }: Args): Promise<React.ReactElement> {
  return NotFoundPage({ config, importMap, params, searchParams });
}
