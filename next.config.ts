import { DEV_ENV, PROD_ENV } from '@Constants/envs';
import withPWA from '@ducanh2912/next-pwa';
import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const isProd = process.env.NEXT_PUBLIC_APP_ENV === PROD_ENV;
const baseConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '1337'
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      // Uploads live on Cloudinary now and Payload hands out their URLs
      // directly rather than proxying them, so next/image fetches from here.
      // Scoped to this cloud's own path: a bare `res.cloudinary.com` would
      // let the optimizer be pointed at any account on the service.
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dk8vmvvj6/**'
      }
    ]
  }
};

const createNextConfig = (): NextConfig => {
  if (isProd) {
    return withPWA({
      dest: 'public',
      disable: process.env.NEXT_PUBLIC_APP_ENV === DEV_ENV,
      register: true,
      workboxOptions: {
        skipWaiting: true,
        clientsClaim: true,
        disableDevLogs: true
      }
    })(baseConfig);
  }
  return baseConfig;
};

// withPayload goes OUTERMOST, so the admin's server-only packages are
// externalised after the PWA plugin has finished rewriting the config
// rather than before. It also adds the admin's own webpack/turbopack
// aliases, which the PWA wrapper has no opinion about.
export default withPayload(createNextConfig());
