/**
 * Writes src/components/Mark/mark.json — the M in the middle of the header.
 *
 * One stroke, heavy and square-cornered like the masthead's Nippo: up the
 * left leg, down into the valley, up again, down the right leg. It is drawn
 * in one placeholder tone that global.css replaces with `--ink` through the
 * layer class `mark-ink`, which is what lets it sit inside `.st-blend` and
 * land as ink on paper like the words beside it.
 *
 * On hover or focus it plays once, 1.2s: the stroke wipes out left to right
 * and draws itself back in left to right — one direction, the way the route
 * curtain only ever travels up — and as the pen comes back through the
 * middle the valley drops and springs back. Frame 0 and the last frame are
 * the same whole M, so stopping on either is the logo at rest.
 *
 *   node scripts/mark-lottie.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FPS = 30;
const END = 36;
const W = 100;
const H = 84;
/** Where the wipe-out ends and the redraw begins. */
const TURN = 14;

const INK = [0.078, 0.067, 0.059, 1];

const still = (k) => ({ a: 0, k });
const ease = { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] } };
/** Accelerating out of sight, and coming back already moving. */
const easeIn = { i: { x: [1], y: [1] }, o: { x: [0.55], y: [0] } };
const easeOut = { i: { x: [0.2], y: [1] }, o: { x: [0], y: [0] } };
/**
 * Animated through [frame, value, curve?] triples. `curve` is 'hold' to jump
 * instead of easing, or an easing object; the default is `ease`.
 */
const track = (pairs) => ({
  a: 1,
  k: pairs.map(([t, v, curve], index) => {
    const s = Array.isArray(v) ? v : [v];
    if (index === pairs.length - 1) return { t, s };
    if (curve === 'hold') return { t, s, h: 1 };
    return { t, s, ...(curve ?? ease) };
  })
});

/** The M, with its valley at `valley`. */
const m = (valley) => ({
  i: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
  ],
  o: [
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0],
    [0, 0]
  ],
  v: [
    [15, 74],
    [15, 18],
    [50, valley],
    [85, 18],
    [85, 74]
  ],
  c: false
});
const REST = 54;

const path = {
  ty: 'sh',
  ks: track([
    [0, m(REST)],
    [TURN, m(REST)],
    [22, m(66)],
    [28, m(48)],
    [END, m(REST)]
  ])
};
// Out left to right (the start chases the end), then — held, so nothing is
// seen jumping — back in left to right. The wipe accelerates away and the
// redraw starts already moving, so the moment with no M at all is a frame
// or two rather than the ~300ms an ease on both halves left empty.
const trim = {
  ty: 'tm',
  s: track([
    [0, 0, easeIn],
    [TURN, 100, 'hold'],
    [TURN + 1, 0]
  ]),
  e: track([
    [0, 100],
    [TURN, 100, 'hold'],
    [TURN + 1, 0, easeOut],
    [END, 100]
  ]),
  o: still(0),
  m: 1
};
const stroke = { ty: 'st', c: still(INK), o: still(100), w: still(13), lc: 1, lj: 1, ml: 4 };
const transform = {
  ty: 'tr',
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100),
  sk: still(0),
  sa: still(0)
};

const animation = {
  v: '5.7.4',
  fr: FPS,
  ip: 0,
  op: END,
  w: W,
  h: H,
  nm: 'mark',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'm',
      cl: 'mark-ink',
      sr: 1,
      ks: {
        o: still(100),
        r: still(0),
        p: still([0, 0, 0]),
        a: still([0, 0, 0]),
        s: still([100, 100, 100])
      },
      ao: 0,
      shapes: [{ ty: 'gr', it: [path, trim, stroke, transform] }],
      ip: 0,
      op: END,
      st: 0,
      bm: 0
    }
  ]
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/components/Mark/mark.json');
writeFileSync(out, `${JSON.stringify(animation)}\n`);
console.log(`wrote ${out}`);
