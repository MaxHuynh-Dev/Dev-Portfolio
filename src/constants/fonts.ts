import { JetBrains_Mono, Schibsted_Grotesk } from 'next/font/google';

// Both are variable fonts. Omitting `weight` ships the variable axis as a
// single file per family and still supports every weight via CSS; listing
// weights explicitly would download one static file each.
export const schibstedGrotesk = Schibsted_Grotesk({
  variable: '--font-display',
  subsets: ['latin'],
  display: 'swap'
});

export const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  display: 'swap'
});
