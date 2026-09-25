/**
 * Writes src/components/Corgi/corgi.json — the corgi in the bottom chrome.
 *
 * Hand-built rather than downloaded, for two reasons. This site has no
 * accent colour (CLAUDE.md), so a stock orange corgi would be the one
 * coloured thing on it that is not project imagery; and a stock file comes
 * with a licence to carry. So it is drawn here, in two tones only, and the
 * tones are not even the ones below: each layer carries a class
 * (`corgi-ink` / `corgi-paper`) and global.css paints them with `--ink` and
 * `--paper`, which is what lets the dog sit inside `.st-blend` like every
 * other mark in that row.
 *
 * One 2s cycle at 30fps: the tail wags twelve times, the rear end wiggles
 * with it, and the head tilts into it and back. Frame 0 and the last frame
 * are the same resting pose, so stopping on either is a still dog, not a
 * frozen mid-wag.
 *
 *   node scripts/corgi-lottie.mjs
 */
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FPS = 30;
const END = 60;
const W = 120;
const H = 80;

/** Placeholder fills; CSS replaces both through the layer class. */
const INK = [0.078, 0.067, 0.059, 1];
const PAPER = [0.937, 0.929, 0.918, 1];

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
const group = (fillColour, ...items) => ({
  ty: 'gr',
  it: [...items, fill(fillColour), transform()]
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
  ks: still({
    i: points.map(() => [0, 0]),
    o: points.map(() => [0, 0]),
    v: points,
    c: true
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
const shapes = (ind, nm, cl, parent, ...groups) =>
  layerBase(ind, nm, { ty: 4, cl, parent, ks: ks(), shapes: groups });

// ── Motion ──
// Twelve swings of the tail, fast, which is what reads as pleased rather
// than idle. Rest at both ends.
const wag = [[0, 0]];
for (let t = 5, side = -1; t < END; t += 5, side = -side) wag.push([t, side < 0 ? -32 : 22]);
wag.push([END, 0]);
// The rear end follows the tail, a fraction of it, about the front feet.
const wiggle = wag.map(([t, v]) => [t, v === 0 ? 0 : v < 0 ? 2.4 : -2.4]);
// The head tips into it once and comes back.
const tilt = [
  [0, 0],
  [12, -9],
  [44, -9],
  [END, 0]
];

// ── Rig ── nulls carry the motion; shape layers are parented to them.
const BODY = 20;
const HEAD = 21;
const TAIL = 22;

const layers = [
  // Head details, on top: the nose at the tip of the snout, and the pupil.
  shapes(
    1,
    'head-dots',
    'corgi-ink',
    HEAD,
    group(INK, ellipse(112.5, 35.5, 5.5, 4.5)),
    group(INK, ellipse(95.8, 29.4, 2.2, 2.6))
  ),
  // The white of the muzzle, the eye and the inside of the near ear.
  shapes(
    2,
    'head-light',
    'corgi-paper',
    HEAD,
    group(PAPER, ellipse(104, 40.5, 15, 6.5)),
    group(PAPER, ellipse(95.4, 29.2, 4.6, 5)),
    group(PAPER, poly([91.5, 18], [94.8, 7.5], [98, 18.5]))
  ),
  // Head, a fox's long snout, and two big upright ears — the corgi part.
  shapes(
    3,
    'head',
    'corgi-ink',
    HEAD,
    group(INK, poly([87.5, 21.5], [95, 1.5], [101, 22])),
    group(INK, ellipse(104, 37.5, 19, 12)),
    group(INK, ellipse(90, 32, 28, 26)),
    group(INK, poly([78.5, 26], [81.5, 3.5], [92, 20]))
  ),
  // The white chest, inside the front of the body.
  shapes(4, 'chest', 'corgi-paper', BODY, group(PAPER, ellipse(84, 53, 12, 13))),
  // A long body on four short legs, and a round, full rear.
  shapes(
    5,
    'body',
    'corgi-ink',
    BODY,
    group(INK, rect(58, 50, 64, 24, 12)),
    group(INK, ellipse(32, 47, 22, 24)),
    group(INK, rect(34, 64, 9, 14, 3)),
    group(INK, rect(46, 64, 9, 14, 3)),
    group(INK, rect(72, 64, 9, 14, 3)),
    group(INK, rect(83, 64, 9, 14, 3))
  ),
  // The tail, a tuft that starts INSIDE the rear so it wags from the dog
  // rather than floating beside it; behind the body, so it comes out from
  // under it.
  shapes(6, 'tail', 'corgi-ink', TAIL, group(INK, ellipse(20, 39, 18, 11))),
  nul(BODY, 'rig-body', [80, 71], track(wiggle)),
  nul(HEAD, 'rig-head', [86, 43], track(tilt), BODY),
  nul(TAIL, 'rig-tail', [29, 42], track(wag), BODY)
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
