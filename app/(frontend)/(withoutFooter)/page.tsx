import JsonLd from '@Components/JsonLd';
import { pageMetadata } from '@Constants/metadata';
import Studio from '@Modules/Studio';
import type { Metadata } from 'next';
import type React from 'react';
import { getFullName, getProfile } from '@/content/source';
import { personNode, websiteNode } from '@/content/structuredData';

// No `title` here on purpose: the index takes the layout's default, "Name,
// Role". Giving it a title would run it through the template and read
// "Something | Name".
export async function generateMetadata(): Promise<Metadata> {
  const [profile, fullName] = await Promise.all([getProfile(), getFullName()]);
  return pageMetadata({
    description: `${fullName}, ${profile.role} in ${profile.location}. ${profile.intro}`,
    path: '/'
  });
}

export default async function Home(): Promise<React.ReactElement> {
  const graph = await Promise.all([websiteNode(), personNode()]);
  return (
    <>
      <JsonLd graph={graph} />
      <Studio />
    </>
  );
}
