import Library from '@Modules/Library';
import type { Metadata } from 'next';
import type React from 'react';
import { getProjects, getSiteSettings } from '@/content/source';

export async function generateMetadata(): Promise<Metadata> {
  const { workRange } = await getSiteSettings();
  return {
    // The root layout's title template turns this into "Work | Role".
    //
    // It was "All work" while the index carried a shortlist and this page
    // was the rest of it. The index has no work list any more (trap 41), so
    // `all` is a comparison with nothing — and the corner mark that lands
    // here says `work`, which a destination naming itself something else
    // would quietly contradict.
    title: 'Work',
    description: `Every project, ${workRange}.`
  };
}

export default async function WorksPage(): Promise<React.ReactElement> {
  const [projects, settings] = await Promise.all([getProjects(), getSiteSettings()]);
  return <Library projects={projects} workRange={settings.workRange} />;
}
