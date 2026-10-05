import type { MetadataRoute } from 'next';
import { getFullName, getProfile } from '@/content/source';

/**
 * The web app manifest, built from the CMS like the rest of the metadata.
 *
 * It replaces `public/manifest.json`, which was the starter template's:
 * `"name": "APP_NAME"`, `"url": "APP_DOMAIN"` and a white theme, served live.
 * Next links this file from every page by itself, so the metadata no longer
 * names a manifest.
 *
 * The colours are the paper, `--paper` in `global.css` — the same value the
 * layout's `themeColor` carries. Copies: change the ground, change them too.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const [profile, fullName] = await Promise.all([getProfile(), getFullName()]);
  return {
    name: `${fullName}, ${profile.role}`,
    short_name: fullName,
    description: profile.intro,
    start_url: '/',
    display: 'standalone',
    background_color: '#efedea',
    theme_color: '#efedea',
    icons: [
      { src: '/pwa/192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/pwa/512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.png', sizes: '512x512', type: 'image/png', purpose: 'any' }
    ]
  };
}
