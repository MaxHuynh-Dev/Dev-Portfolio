import JsonLd from '@Components/JsonLd';
import { pageMetadata } from '@Constants/metadata';
import AboutView from '@Modules/About';
import type { Metadata } from 'next';
import type React from 'react';
import { getAbout, getFullName, getProfile } from '@/content/source';
import { personNode, profilePageNode } from '@/content/structuredData';

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout();
  return pageMetadata({
    // The template turns this into "About | Name".
    title: 'About',
    // The statement and the prose under it are the page's own summary — no
    // second text written for search engines and nobody else. `pageMetadata`
    // cuts it to a result's length at a word.
    description: [about.statement, ...about.body].join(' '),
    path: '/about'
  });
}

export default async function AboutPage(): Promise<React.ReactElement> {
  const [about, profile, fullName, person] = await Promise.all([
    getAbout(),
    getProfile(),
    getFullName(),
    personNode()
  ]);
  return (
    <>
      <JsonLd graph={[profilePageNode('/about', `About | ${fullName}`), person]} />
      <AboutView about={about} profile={profile} />
    </>
  );
}
