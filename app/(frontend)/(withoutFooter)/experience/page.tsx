import ExperienceView from '@Modules/Experience';
import type { Metadata } from 'next';
import type React from 'react';
import { getExperience, getProfile } from '@/content/source';

export async function generateMetadata(): Promise<Metadata> {
  const positions = await getExperience();
  const companies = positions.map((position) => position.company).join(', ');
  return {
    // The root layout's title template turns this into "Experience | Role".
    title: 'Experience',
    description:
      companies.length > 0 ? `Where I have worked: ${companies}.` : 'Where I have worked.'
  };
}

export default async function ExperiencePage(): Promise<React.ReactElement> {
  const [positions, profile] = await Promise.all([getExperience(), getProfile()]);
  return <ExperienceView positions={positions} profile={profile} />;
}
