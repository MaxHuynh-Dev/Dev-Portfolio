import { DEFAULT_METADATA } from '@Constants/metadata';
import HomePage from '@Modules/HomePage';
import type { Metadata } from 'next';
import type React from 'react';

export const metadata: Metadata = DEFAULT_METADATA;

export default function Home(): React.ReactElement {
  return <HomePage />;
}
