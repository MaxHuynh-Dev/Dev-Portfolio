import ProjectView from '@Modules/Project';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type React from 'react';
import { PROJECTS } from '@/content/site';

type Params = { params: Promise<{ slug: string }> };

/** The set of projects is fixed at build time, so an unknown slug is a 404
 *  rather than something to render on demand. */
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = PROJECTS.find((item) => item.slug === slug);
  if (project === undefined) return {};

  return {
    // The root layout's title template turns this into "Name | Role".
    title: project.name,
    description: project.summary,
    openGraph: {
      title: project.name,
      description: project.summary,
      // Only when there is one. An openGraph entry pointing at a missing
      // file renders worse in a share card than no entry at all.
      ...(project.cover !== null ? { images: [{ url: project.cover }] } : {})
    }
  };
}

export default async function ProjectPage({ params }: Params): Promise<React.ReactElement> {
  const { slug } = await params;
  const index = PROJECTS.findIndex((item) => item.slug === slug);
  if (index === -1) notFound();

  // Wraps, so the last project leads back to the first rather than
  // dead-ending the only way forward on the page.
  const next = PROJECTS[(index + 1) % PROJECTS.length];

  return <ProjectView project={PROJECTS[index]} next={next} />;
}
