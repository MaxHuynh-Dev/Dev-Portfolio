/**
 * The parts of the site's identity that are NOT content.
 *
 * Everything here is a property of the deployment rather than of the
 * person: where the site lives, what it is filed under, which file the
 * share card uses. The name, the role, the description and the contact
 * address used to sit beside them and now come from the CMS — see
 * `src/constants/metadata.ts`, which is async for exactly that reason.
 *
 * Keep these synchronous. `app/robots.ts` and `app/sitemap.ts` read
 * DOMAIN_URL at module scope.
 */
/**
 * The production deployment on Vercel. Every absolute URL the site hands out
 * is built on it — the share card's image above all, which a crawler cannot
 * resolve against anything else. Change it here when a custom domain goes on.
 */
export const DOMAIN_URL = 'https://max-dev-portfolio.vercel.app';
export const APP_KEYWORDS = [
  'Front-End Developer',
  'Creative Developer',
  'UI Engineer',
  'Next.js',
  'GSAP',
  'Three.js',
  'WebGL',
  'Portfolio'
];
/**
 * The share card: the owner's own illustration, 1200x630. The file supplied
 * is 2:1, so it is set at 1200x600 with 15px of its own top and bottom rows added
 * above and below, rather than cropped; the Apple logo on the lid is painted
 * out, as it is in the Lottie (trap 50). A JPEG, 95KB — a PNG of the same
 * picture is 328KB, and some messengers drop a preview past ~300KB.
 */
export const APP_OG_IMAGE = '/images/og-image.jpg';
/** It describes the picture, so it says what the picture says — the name is baked into the file. */
export const APP_OG_IMAGE_ALT =
  'Max Huynh, Frontend Developer and Web Enthusiast, drawn waving from behind a laptop at a desk, beside the line "Building clean, fast and user-friendly web experiences."';
