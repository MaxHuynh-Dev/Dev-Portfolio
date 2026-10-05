export const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'development';
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.example.com';
export const PROD_ENV = 'production';
export const DEV_ENV = 'development';

/**
 * Whether search engines may index this build, which is what `app/robots.ts`
 * and `app/sitemap.ts` ask.
 *
 * On Vercel it is `VERCEL_ENV`, which the platform sets itself at build time:
 * only the production deployment opens the doors, and every preview stays
 * shut without anyone having to remember a variable. It used to be
 * `NEXT_PUBLIC_APP_ENV`, which nobody had set on Vercel, so the live site
 * shipped `Disallow: /` and an empty sitemap — the whole portfolio invisible
 * to search. That variable also switches next-pwa on (`next.config.ts`), so
 * setting it just to be indexed would have shipped a service worker too.
 *
 * Off Vercel there is no `VERCEL_ENV`, and the old answer still applies.
 */
export const IS_INDEXABLE =
  process.env.VERCEL_ENV !== undefined ? process.env.VERCEL_ENV === PROD_ENV : APP_ENV === PROD_ENV;
