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
  // ONE variable file on a weight axis of 200 to 700, in place of three
  // static cuts. The masthead's letters move along that axis under the
  // pointer (usePressure), which static files cannot do; and every other
  // line still lands on exactly the weight it had, because the old cuts are
  // points on the same axis — checked glyph by glyph, advances identical and
  // outlines within half a unit of a thousand. 29KB against 46KB for the
  // three it replaced, and one request.
  //
  // The one catch is that Regular is NOT at 400 on this axis. It is at 378,
  // which is where the static Regular's outlines are; `.st-display-reg`
  // asks for 378 by number for that reason. A `400` there would be a
  // slightly heavier weight than the one this site was designed in.
  src: [
    {
      path: '../../public/fonts/nippo-variable.woff2',
      weight: '200 700',
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
