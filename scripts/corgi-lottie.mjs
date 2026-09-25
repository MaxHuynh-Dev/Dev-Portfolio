/**
 * Writes src/components/Corgi/corgi.json — the corgi in the bottom chrome.
 *
 * Drawn here rather than downloaded, so there is no licence to carry and
 * every shape is ours to change. It is a Pembroke in its own colours —
 * orange-tan and white, black nose and eyes, a pink tongue — sitting up and
 * facing the reader, a little round, with one front paw that lifts and waves.
 *
 * **Those colours are the one exception to "no accent colour", and it is
 * the owner's.** Everything else on this site is ink on paper; the owner
 * asked for the dog in its real coat. It therefore sits OUTSIDE `.st-blend`
 * (a difference blend would turn orange into blue) and its tones are baked
 * into the file below rather than taken from the tokens.
 *
 * One 2s cycle at 30fps: the paw comes up, waves three times, and goes back
 * down; the head tips into it; the tail sweeps behind. Frame 0 and the last
 * frame are the same resting pose — sitting, paw down — so stopping on
 * either is a still dog, not a frozen wave.
 *
 *   node scripts/corgi-lottie.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FPS = 30;
const END = 60;
const W = 100;
const H = 100;

const hex = (value) => [
  Number.parseInt(value.slice(1, 3), 16) / 255,
  Number.parseInt(value.slice(3, 5), 16) / 255,
  Number.parseInt(value.slice(5, 7), 16) / 255,
  1
];
/** The coat, read off the reference photograph. */
const TAN = hex('#d8893a');
const TAN_DEEP = hex('#c47629');
const WHITE = hex('#fffaf2');
/** White on warm paper needs an edge to read; a coat-coloured one. */
const EDGE = hex('#e3cfb4');
const EAR_IN = hex('#f4c9a4');
const DARK = hex('#231c18');
const TONGUE = hex('#e98a9c');

const still = (k) => ({ a: 0, k });
const ease = { i: { x: [0.45], y: [1] }, o: { x: [0.55], y: [0] } };
/** An animated scalar through [frame, value] pairs. */
const track = (pairs) => ({
  a: 1,
  k: pairs.map(([t, v], index) =>
    index === pairs.length - 1 ? { t, s: [v] } : { t, s: [v], ...ease }
  )
});

const transform = () => ({
  ty: 'tr',
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100),
  sk: still(0),
  sa: still(0)
});
const fill = (c) => ({ ty: 'fl', c: still(c), o: still(100), r: 1 });
const stroke = (c, w) => ({ ty: 'st', c: still(c), o: still(100), w: still(w), lc: 2, lj: 2 });
/** A filled shape. */
const solid = (colour, ...items) => ({ ty: 'gr', it: [...items, fill(colour), transform()] });
/** A white shape, which needs its edge drawn to read on paper. */
const white = (...items) => ({
  ty: 'gr',
  it: [...items, stroke(EDGE, 1.1), fill(WHITE), transform()]
});
/** A line with no fill — the mouth. */
const line = (colour, width, ...items) => ({
  ty: 'gr',
  it: [...items, stroke(colour, width), transform()]
});
const ellipse = (x, y, w, h) => ({ ty: 'el', p: still([x, y]), s: still([w, h]), d: 1 });
const rect = (x, y, w, h, r) => ({
  ty: 'rc',
  p: still([x, y]),
  s: still([w, h]),
  r: still(r),
  d: 1
});
const poly = (...points) => ({
  ty: 'sh',
  ks: still({ i: points.map(() => [0, 0]), o: points.map(() => [0, 0]), v: points, c: true })
});
/** An open curve from a through b to c, smooth at b. */
const curve = (a, b, c) => ({
  ty: 'sh',
  ks: still({
    i: [
      [0, 0],
      [-(b[0] - a[0]) / 2, 0],
      [0, 0]
    ],
    o: [
      [0, 0],
      [(c[0] - b[0]) / 2, 0],
      [0, 0]
    ],
    v: [a, b, c],
    c: false
  })
});

const layerBase = (ind, nm, extra) => ({
  ddd: 0,
  ind,
  nm,
  sr: 1,
  ao: 0,
  ip: 0,
  op: END,
  st: 0,
  bm: 0,
  ...extra
});
const ks = ({ p = [0, 0], a = [0, 0], r = still(0) } = {}) => ({
  o: still(100),
  r,
  p: still([...p, 0]),
  a: still([...a, 0]),
  s: still([100, 100, 100])
});
const nul = (ind, nm, pivot, r, parent) =>
  layerBase(ind, nm, { ty: 3, ks: ks({ p: pivot, a: pivot, r }), ...(parent ? { parent } : {}) });
const shapes = (ind, nm, parent, ...groups) =>
  layerBase(ind, nm, { ty: 4, parent, ks: ks(), shapes: groups });

// ── Motion ──
// The paw: up, three waves, down. Negative turns the down-hanging leg
// towards the upper right of the picture — the dog's own left paw.
const wave = [
  [0, 0],
  [9, -138],
  [15, -112],
  [21, -152],
  [27, -112],
  [33, -152],
  [39, -112],
  [45, -148],
  [51, -138],
  [END, 0]
];
// The head tips towards the paw once and comes back.
const tilt = [
  [0, 0],
  [10, 7],
  [46, 7],
  [END, 0]
];
// The tail sweeps behind, in time with the waves.
const sweep = [[0, 0]];
for (let t = 6, side = 1; t < END; t += 6, side = -side) sweep.push([t, side * 18]);
sweep.push([END, 0]);

// ── Rig ──
const BODY = 20;
const HEAD = 21;
const ARM = 22;
const TAIL = 23;

const layers = [
  // The waving paw, on top of everything so it passes in front of the chest.
  shapes(
    1,
    'paw',
    ARM,
    solid(EDGE, ellipse(57.5, 94.5, 1.6, 2.2)),
    solid(EDGE, ellipse(62.5, 94.5, 1.6, 2.2)),
    white(ellipse(60, 93.5, 14, 7.5)),
    white(rect(60, 81, 11, 26, 5.5))
  ),
  // The face: eyes, nose, smile and tongue over a white blaze and muzzle,
  // over a round tan head between two big ears.
  shapes(
    2,
    'head',
    HEAD,
    solid(WHITE, ellipse(42.3, 33.6, 1.8, 1.8)),
    solid(WHITE, ellipse(60.3, 33.6, 1.8, 1.8)),
    solid(DARK, ellipse(41.5, 35, 5.6, 6.2)),
    solid(DARK, ellipse(59.5, 35, 5.6, 6.2)),
    solid(DARK, ellipse(50.5, 42, 7.6, 5.4)),
    line(DARK, 1.2, curve([44.5, 46.2], [50.5, 48.6], [56.5, 46.2])),
    solid(TONGUE, ellipse(50.5, 51, 6.2, 7.4)),
    white(ellipse(50.5, 46, 30, 17)),
    solid(WHITE, poly([47.5, 19], [53.5, 19], [56, 40], [45, 40])),
    solid(TAN, ellipse(50.5, 35, 46, 39)),
    // Under the head, so only the part of each ear above it shows pink.
    solid(EAR_IN, poly([33.5, 25], [30, 7.5], [43.5, 19.5])),
    solid(EAR_IN, poly([67.5, 25], [71, 7.5], [57.5, 19.5])),
    solid(TAN_DEEP, poly([28, 31], [25.5, 1.5], [47.5, 19])),
    solid(TAN_DEEP, poly([73, 31], [75.5, 1.5], [53.5, 19]))
  ),
  // The front: the white chest and the paw that stays down.
  shapes(
    3,
    'front',
    BODY,
    solid(EDGE, ellipse(38.5, 94.5, 1.6, 2.2)),
    solid(EDGE, ellipse(43.5, 94.5, 1.6, 2.2)),
    white(ellipse(41, 93.5, 14, 7.5)),
    white(rect(41, 81, 11, 26, 5.5)),
    white(ellipse(50.5, 67, 36, 44))
  ),
  // The body: round and tan, big haunches and white back feet.
  shapes(
    4,
    'body',
    BODY,
    white(ellipse(24, 94.5, 14, 6.5)),
    white(ellipse(77, 94.5, 14, 6.5)),
    solid(TAN, ellipse(28.5, 83, 26, 24)),
    solid(TAN, ellipse(72.5, 83, 26, 24)),
    solid(TAN, ellipse(50.5, 70, 62, 52))
  ),
  // The tail, a tuft behind the right haunch.
  shapes(5, 'tail', TAIL, solid(TAN_DEEP, ellipse(88, 78, 16, 10))),
  nul(BODY, 'rig-body', [50, 96], still(0)),
  nul(HEAD, 'rig-head', [50.5, 55], track(tilt), BODY),
  nul(ARM, 'rig-arm', [60, 69], track(wave), BODY),
  nul(TAIL, 'rig-tail', [80, 84], track(sweep), BODY)
];

const animation = {
  v: '5.7.4',
  fr: FPS,
  ip: 0,
  op: END,
  w: W,
  h: H,
  nm: 'corgi',
  ddd: 0,
  assets: [],
  layers
};

const out = resolve(dirname(fileURLToPath(import.meta.url)), '../src/components/Corgi/corgi.json');
writeFileSync(out, `${JSON.stringify(animation)}\n`);
console.log(`wrote ${out}`);
