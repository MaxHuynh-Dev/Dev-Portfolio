import localFont from 'next/font/local';

/**
 * Two families, no monospace.
 *
 * Nippo carries every display line. It was chosen by rendering four
 * candidates at the sizes this page actually uses rather than by
 * reputation: its sides are flat and its corners squared — the box model,
 * literally — and its figures read like an instrument readout, which is
 * what the counter, the years and the studies' live numbers all are. Array
 * was the first pick and was rejected on sight: it is a halftone-dot face
 * that turns to noise below about 40px.
 *
 * There is deliberately no mono. A monospace face used for small data
 * labels is one of the most reliable tells of a generated page, and this
 * page used it for every label until this rebuild.
 *
 * Self-hosted from public/fonts (Fontshare, free for commercial use) so
 * there is no third-party request on the critical path — the preloader
 * weights document.fonts.ready at 65%, and a font that never arrives would
 * hold the curtain to its hard cap.
 */
export const nippo = localFont({
  variable: '--font-display',
  display: 'swap',
  src: [
    {
      path: '../../public/fonts/nippo-400.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../../public/fonts/nippo-500.woff2',
      weight: '500',
      style: 'normal'
    },
    {
      path: '../../public/fonts/nippo-700.woff2',
      weight: '700',
      style: 'normal'
    }
  ]
});

export const switzer = localFont({
  variable: '--font-text',
  display: 'swap',
  src: [
    {
      path: '../../public/fonts/switzer-400.woff2',
      weight: '400',
      style: 'normal'
    },
    {
      path: '../../public/fonts/switzer-500.woff2',
      weight: '500',
      style: 'normal'
    },
    {
      path: '../../public/fonts/switzer-600.woff2',
      weight: '600',
      style: 'normal'
    }
  ]
});
