const APP_ENV = process.env.NEXT_PUBLIC_APP_ENV ?? 'development';
const PROD_ENV = 'production';

/**
 * Whether search engines may index this build, which is what `app/robots.ts`
 * and `app/sitemap.ts` ask.
 *
 * On Vercel it is `VERCEL_ENV`, which the platform sets itself at build time:
 * only the production deployment opens the doors, and every preview stays
 * shut without anyone having to remember a variable. It used to be
 * `NEXT_PUBLIC_APP_ENV`, which nobody had set on Vercel, so the live site
 * shipped `Disallow: /` and an empty sitemap — the whole portfolio invisible
 * to search.
 *
 * Off Vercel there is no `VERCEL_ENV`, and the old answer still applies.
 */
export const IS_INDEXABLE =
  process.env.VERCEL_ENV !== undefined ? process.env.VERCEL_ENV === PROD_ENV : APP_ENV === PROD_ENV;
