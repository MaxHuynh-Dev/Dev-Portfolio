import JsonLd from '@Components/JsonLd';
import { pageMetadata } from '@Constants/metadata';
import ExperienceView from '@Modules/Experience';
import type { Metadata } from 'next';
import type React from 'react';
import { getExperience, getFullName, getProfile } from '@/content/source';
import { personNode, profilePageNode } from '@/content/structuredData';

export async function generateMetadata(): Promise<Metadata> {
  const [positions, profile, fullName] = await Promise.all([
    getExperience(),
    getProfile(),
    getFullName()
  ]);
  const roles = positions.map((position) => `${position.role} at ${position.company}`).join('; ');
  return pageMetadata({
    // The template turns this into "Experience | Name".
    title: 'Experience',
    description:
      roles.length > 0
        ? `Where ${fullName}, ${profile.role}, has worked: ${roles}.`
        : `Where ${fullName}, ${profile.role}, has worked.`,
    path: '/experience'
  });
}

export default async function ExperiencePage(): Promise<React.ReactElement> {
  const [positions, profile, fullName, person] = await Promise.all([
    getExperience(),
    getProfile(),
    getFullName(),
    personNode()
  ]);
  return (
    <>
      <JsonLd
        graph={[profilePageNode('/experience', `Experience | ${fullName}`, 'WebPage'), person]}
      />
      <ExperienceView positions={positions} profile={profile} />
    </>
  );
}
