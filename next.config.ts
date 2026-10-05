import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Two root layouts — the site's and Payload's — leave no single layout
    // to build a 404 for an unmatched URL from. `app/global-not-found.tsx`
    // is that page; a `notFound()` inside the site uses
    // `app/(frontend)/not-found.tsx`, which keeps the site's chrome.
    globalNotFound: true
  },
  images: {
    // A month. Every image here is a Cloudinary URL carrying its version
    // segment, so a URL's bytes never change — a new upload is a new URL.
    // It was 3600, under Next's own default, which re-optimised every
    // picture hourly and lengthened the route curtain's cold-cache wait for
    // decoded images (trap 47).
    minimumCacheTTL: 2678400,
    remotePatterns: [
      // Uploads live on Cloudinary and Payload hands out their URLs
      // directly rather than proxying them, so next/image fetches from here.
      // Scoped to this cloud's own path: a bare `res.cloudinary.com` would
      // let the optimizer be pointed at any account on the service. It is
      // the ONLY remote source — the starter's `images.unsplash.com`, open
      // to any image on that service, and a local Strapi on 127.0.0.1 went.
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dk8vmvvj6/**'
      }
    ]
  }
};

// There is no PWA wrapper. `@ducanh2912/next-pwa` is a webpack plugin and
// this app builds with Turbopack, so it never produced a service worker —
// `/sw.js` answered 404 in production — and its `disable` flag could not
// be true inside the only branch that applied it. Removed with its
// dependency rather than left to look like it did something.
//
// withPayload stays outermost, so the admin's server-only packages are
// externalised after anything else has finished rewriting the config.
export default withPayload(nextConfig);
