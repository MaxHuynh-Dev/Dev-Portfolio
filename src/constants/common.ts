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
export const DOMAIN_URL = "https://example.com"; // TODO: your deployed domain
export const APP_KEYWORDS = [
  "Front-End Developer",
  "Creative Developer",
  "UI Engineer",
  "Next.js",
  "GSAP",
  "Three.js",
  "WebGL",
  "Portfolio",
];
export const APP_OG_IMAGE = "/images/og-image.png"; // TODO: add this file
