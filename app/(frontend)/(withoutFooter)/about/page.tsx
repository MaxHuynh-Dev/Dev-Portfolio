import AboutView from '@Modules/About';
import type { Metadata } from 'next';
import type React from 'react';
import { getAbout, getProfile } from '@/content/source';

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout();
  return {
    // The root layout's title template turns this into "About | Role".
    title: 'About',
    // The statement is the page's own summary, so it is the description —
    // no second sentence written for search engines and nobody else.
    description: about.statement
  };
}

export default async function AboutPage(): Promise<React.ReactElement> {
  const [about, profile] = await Promise.all([getAbout(), getProfile()]);
  return <AboutView about={about} profile={profile} />;
}
