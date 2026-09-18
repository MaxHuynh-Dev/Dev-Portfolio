import Library from '@Modules/Library';
import type { Metadata } from 'next';
import type React from 'react';
import { getProjects, getSiteSettings } from '@/content/source';

export async function generateMetadata(): Promise<Metadata> {
  const { workRange } = await getSiteSettings();
  return {
    // The root layout's title template turns this into "All work | Role".
    title: 'All work',
    description: `Every project, ${workRange}.`
  };
}

export default async function WorksPage(): Promise<React.ReactElement> {
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()]);
  return <Library projects={projects} workRange={settings.workRange} />;
}
