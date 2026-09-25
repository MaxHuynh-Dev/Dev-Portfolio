import ProjectView from '@Modules/Project';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type React from 'react';
import { getProfile, getProjects } from '@/content/source';

type Params = { params: Promise<{ slug: string }> };

/**
 * Every project is prerendered at build, and a slug the build did not know
 * about is rendered on its first visit rather than refused — so a project
 * added in the CMS has a page as soon as it is saved. An unknown slug is
 * still a 404: the page itself calls `notFound()` when the database has no
 * such project.
 *
 * **There is deliberately no `dynamicParams = false` here, and it is not a
 * style choice.** With it, a prerendered page whose cache entry has been
 * invalidated counts as a param with no fallback, and Next answers 404
 * (`NoFallbackError` in the server log). A save in `/admin` invalidates
 * every page (`src/payload/hooks/revalidateSite.ts`), so the first edit
 * after a deploy turned all five project pages into 404s — measured on
 * `next start`, 200 before the save and 404 on every visit after it.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const projects = await getProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const projects = await getProjects();
  const project = projects.find((item) => item.slug === slug);
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
  const [projects, profile] = await Promise.all([getProjects(), getProfile()]);
  const index = projects.findIndex((item) => item.slug === slug);
  if (index === -1) notFound();

  // Wraps, so the last project leads back to the first rather than
  // dead-ending the only way forward on the page.
  const next = projects[(index + 1) % projects.length];

  return <ProjectView project={projects[index]} next={next} profile={profile} />;
}
