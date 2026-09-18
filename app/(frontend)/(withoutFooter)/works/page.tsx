import Library from '@Modules/Library';
import type { Metadata } from 'next';
import type React from 'react';
import { WORK_RANGE } from '@/content/site';

export const metadata: Metadata = {
  // The root layout's title template turns this into "All work | Role".
  title: 'All work',
  description: `Every project, ${WORK_RANGE}.`
};

export default function WorksPage(): React.ReactElement {
  return <Library />;
}
