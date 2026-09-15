import { PROFILE } from '@Modules/EditorialHome/constants';

// Derived from the single content file so the site name, description and
// contact address can never drift out of sync with the page itself.
const FULL_NAME = `${PROFILE.firstName} ${PROFILE.lastName}`;

export const APP_NAME = FULL_NAME;
export const APP_TITLE_TEMPLATE = `%s | ${PROFILE.role}`;
export const DOMAIN_URL = 'https://example.com'; // TODO: your deployed domain
export const APP_DESCRIPTION = PROFILE.intro;
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
export const EMAIL_CONTACT = PROFILE.email;
export const APP_OG_IMAGE = '/images/og-image.png'; // TODO: add this file
