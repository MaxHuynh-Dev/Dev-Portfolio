import JsonLd from '@Components/JsonLd';
import { pageMetadata } from '@Constants/metadata';
import Library from '@Modules/Library';
import type { Metadata } from 'next';
import type React from 'react';
import { getFullName, getProfile, getProjects, getSiteSettings } from '@/content/source';
import { workListNode } from '@/content/structuredData';

export async function generateMetadata(): Promise<Metadata> {
  const [projects, { workRange }, profile, fullName] = await Promise.all([
    getProjects(),
    getSiteSettings(),
    getProfile(),
    getFullName()
  ]);
  const names = projects.map((project) => project.name).join(', ');
  return pageMetadata({
    // The template turns this into "Work | Name".
    //
    // It was "All work" while the index carried a shortlist and this page
    // was the rest of it. The index has no work list any more (trap 41), so
    // `all` is a comparison with nothing — and the corner mark that lands
    // here says `work`, which a destination naming itself something else
    // would quietly contradict.
    title: 'Work',
    description: `Websites by ${fullName}, ${profile.role}, ${workRange}: ${names}.`,
    path: '/works'
  });
}

export default async function WorksPage(): Promise<React.ReactElement> {
  const [projects, settings, fullName] = await Promise.all([
    getProjects(),
    getSiteSettings(),
    getFullName()
  ]);
  return (
    <>
      <JsonLd graph={[workListNode(`Work | ${fullName}`, projects)]} />
      <Library projects={projects} workRange={settings.workRange} />
    </>
  );
}
