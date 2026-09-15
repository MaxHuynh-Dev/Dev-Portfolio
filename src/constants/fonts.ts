import { Inter, Raleway } from 'next/font/google';

// Inter and Raleway are variable fonts. Omitting `weight` ships the variable
// axis as a single file per family and still supports every weight 100-900
// via CSS; listing weights explicitly would download one static file each.
export const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap'
});

export const raleway = Raleway({
  variable: '--font-raleway',
  subsets: ['latin'],
  display: 'swap'
});
