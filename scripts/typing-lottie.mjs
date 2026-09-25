/**
 * Writes `public/lottie/typing.json` — the owner at a laptop, typing — the
 * animation over the index's masthead.
 *
 * **The figure is the owner's own portrait, traced, not redrawn.** A first
 * version drew him from scratch in simple shapes and did not look like him.
 * So `scripts/portrait/trace.py` vectorises the line portrait he supplied
 * (`scripts/portrait/portrait.png`) into `scripts/portrait/paths.json`, and
 * this script puts those exact lines on the page: his hair, his glasses, his
 * smile, his shirt. What is added is drawn here — a laptop in front of him
 * that hides the crossed arms, a mug, and the marks of what he types.
 *
 * The motion is keyed by hand. The head is the same traced shape as the
 * body under a mask, so it can nod about the neck without a seam; the eyes
 * blink under a paper lid; code marks rise off the lid; steam drifts.
 *
 * Only the site's two inks are used, copied from `global.css` (trap 7:
 * they are copies — re-run after a palette change). `Typist` plays whatever
 * Lottie sits at the output path, so a designer's file can replace this.
 *
 *   node scripts/typing-lottie.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../public/lottie/typing.json');
const PORTRAIT = JSON.parse(readFileSync(resolve(HERE, 'portrait/paths.json'), 'utf8'));

const W = 560;
const H = 540;
const FPS = 30;
const FRAMES = 120; // one 4s loop

/** Where the traced portrait sits in the composition. */
const SHIFT = [-40, -40];

/** `--ink` and `--paper`, as Lottie's 0–1 channels. */
const hex = (value) => [1, 3, 5].map((at) => Number.parseInt(value.slice(at, at + 2), 16) / 255);
const INK = [...hex('#14110f'), 1];
const PAPER = [...hex('#efedea'), 1];
/** The traced lines are about this heavy; what is drawn here matches. */
const LINE = 2.8;

// ─── paths ──────────────────────────────────────────────────────────────

/**
 * An absolute SVG path (M, L, Q, C, Z only) as Lottie vertices. A cubic
 * segment P0 -> P3 through C1, C2 becomes P0's out-tangent (C1 - P0) and
 * P3's in-tangent (C2 - P3); a line has zero tangents.
 */
function path(d) {
  const tokens = d.match(/[MLQCZ]|-?\d*\.?\d+/g);
  const shapes = [];
  let current = null;
  let at = 0;
  let command = '';
  const num = () => Number(tokens[at++]);
  const last = () => current.v[current.v.length - 1];
  const push = (point, inTangent) => {
    current.v.push(point);
    current.i.push(inTangent);
    current.o.push([0, 0]);
  };

  while (at < tokens.length) {
    if (/[MLQCZ]/.test(tokens[at])) command = tokens[at++];
    if (command === 'M') {
      current = { v: [], i: [], o: [], c: false };
      shapes.push(current);
      push([num(), num()], [0, 0]);
      command = 'L';
    } else if (command === 'L') {
      push([num(), num()], [0, 0]);
    } else if (command === 'Q') {
      const p0 = last();
      const q = [num(), num()];
      const p3 = [num(), num()];
      const c1 = [p0[0] + (2 / 3) * (q[0] - p0[0]), p0[1] + (2 / 3) * (q[1] - p0[1])];
      const c2 = [p3[0] + (2 / 3) * (q[0] - p3[0]), p3[1] + (2 / 3) * (q[1] - p3[1])];
      current.o[current.o.length - 1] = [c1[0] - p0[0], c1[1] - p0[1]];
      push(p3, [c2[0] - p3[0], c2[1] - p3[1]]);
    } else if (command === 'C') {
      const p0 = last();
      const c1 = [num(), num()];
      const c2 = [num(), num()];
      const p3 = [num(), num()];
      current.o[current.o.length - 1] = [c1[0] - p0[0], c1[1] - p0[1]];
      push(p3, [c2[0] - p3[0], c2[1] - p3[1]]);
    } else if (command === 'Z') {
      current.c = true;
      // A closing point on top of the first is Lottie's closing segment.
      const first = current.v[0];
      const end = last();
      if (current.v.length > 1 && end[0] === first[0] && end[1] === first[1]) {
        current.i[0] = current.i.pop();
        current.v.pop();
        current.o.pop();
      }
      command = '';
    }
  }
  return shapes;
}

/** Move every point of an absolute path. */
const shift = (d, [dx, dy]) =>
  d.replace(/([MLQC])([^MLQCZ]*)/g, (_, command, args) => {
    const values = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    const moved = values.map((value, index) => +(value + (index % 2 === 0 ? dx : dy)).toFixed(2));
    return `${command}${moved.join(' ')} `;
  });

/** An ellipse as four cubic arcs. */
const ellipse = (cx, cy, rx, ry) => {
  const k = 0.5523;
  return (
    `M${cx} ${cy - ry} C${cx + rx * k} ${cy - ry} ${cx + rx} ${cy - ry * k} ${cx + rx} ${cy} ` +
    `C${cx + rx} ${cy + ry * k} ${cx + rx * k} ${cy + ry} ${cx} ${cy + ry} ` +
    `C${cx - rx * k} ${cy + ry} ${cx - rx} ${cy + ry * k} ${cx - rx} ${cy} ` +
    `C${cx - rx} ${cy - ry * k} ${cx - rx * k} ${cy - ry} ${cx} ${cy - ry} Z`
  );
};

/** A polygon, closed. */
const poly = (points) => `M${points.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;

// ─── Lottie plumbing ────────────────────────────────────────────────────

const still = (k) => ({ a: 0, k });
/** Keyframes as `[frame, value]`; `hold` jumps instead of easing. */
const moving = (keys, { hold = false } = {}) => {
  // Two keys on one frame is a jump Lottie does not need spelling out.
  const frames = keys.filter(([t], index) => index === 0 || t !== keys[index - 1][0]);
  return {
    a: 1,
    k: frames.map(([t, s], index) =>
      index === frames.length - 1
        ? { t, s }
        : hold
          ? { t, s, h: 1 }
          : {
              t,
              s,
              i: { x: s.map(() => 0.45), y: s.map(() => 1) },
              o: { x: s.map(() => 0.55), y: s.map(() => 0) }
            }
    )
  };
};

const transform = () => ({
  ty: 'tr',
  p: still([0, 0]),
  a: still([0, 0]),
  s: still([100, 100]),
  r: still(0),
  o: still(100)
});

/** One group: some paths, then how they are painted. */
function group(d, { fill = null, stroke = INK, width = LINE, evenOdd = false } = {}) {
  const items = path(d).map((ks) => ({ ty: 'sh', ks: still(ks) }));
  if (stroke !== null) {
    items.push({ ty: 'st', c: still(stroke), o: still(100), w: still(width), lc: 2, lj: 2 });
  }
  if (fill !== null) items.push({ ty: 'fl', c: still(fill), o: still(100), r: evenOdd ? 2 : 1 });
  items.push(transform());
  return { ty: 'gr', it: items };
}

/** A layer mask: `mode` a(dd), s(ubtract) or i(ntersect). */
const mask = (d, mode = 'a') => ({
  inv: false,
  mode,
  pt: still(path(d)[0]),
  o: still(100),
  x: still(0)
});

let nextIndex = 1;
/** A shape layer. `groups` are listed top first, as Lottie paints them. */
function layer(name, groups, { pivot = [0, 0], parent, r, p, s, o, masks } = {}) {
  return {
    ddd: 0,
    ind: nextIndex++,
    ty: 4,
    nm: name,
    sr: 1,
    ...(parent === undefined ? {} : { parent }),
    ks: {
      o: o ?? still(100),
      r: r ?? still(0),
      p: p ?? still([...pivot, 0]),
      a: still([...pivot, 0]),
      s: s ?? still([100, 100, 100])
    },
    ao: 0,
    ...(masks === undefined ? {} : { hasMask: true, masksProperties: masks }),
    shapes: groups,
    ip: 0,
    op: FRAMES,
    st: 0,
    bm: 0
  };
}

// ─── the portrait ───────────────────────────────────────────────────────

/** Every traced line, as one even-odd ink fill — holes stay holes. */
const portrait = () =>
  group(PORTRAIT.paths.map((d) => shift(d, SHIFT)).join(' '), {
    fill: INK,
    stroke: null,
    evenOdd: true
  });

/**
 * The head, cut from the body along the neck: above the collar points and
 * the chin, below nothing. The body carries the complement, so at rest the
 * two layers are the one drawing, and a nod of a degree or two about the
 * neck moves the cut by a fraction of a pixel.
 */
const HEAD = poly([
  [80, 0],
  [340, 0],
  [340, 160],
  [296, 176],
  [270, 188],
  [262, 206],
  [200, 206],
  [182, 196],
  [150, 176],
  [80, 160]
]);
const NECK = [231, 206];
/** Everything above the desk; the traced shirt runs on below it. */
const ABOVE_DESK = poly([
  [0, 0],
  [W, 0],
  [W, 468],
  [0, 468]
]);

const nod = moving([
  [0, [0]],
  [30, [-1.6]],
  [60, [0.5]],
  [90, [-1]],
  [120, [0]]
]);

const head = layer('head', [portrait()], {
  pivot: NECK,
  r: nod,
  masks: [mask(HEAD)]
});

const body = layer('body', [portrait()], {
  masks: [mask(ABOVE_DESK), mask(HEAD, 's')]
});

/**
 * A blink: paper over each pupil and a closed lid drawn across it, shown for
 * three frames a loop. On the head, so it nods with it.
 */
const PUPILS = [
  [189, 121],
  [240, 111.5]
];
const blink = layer(
  'blink',
  [
    group(PUPILS.map(([x, y]) => `M${x - 7} ${y} Q${x} ${y + 4} ${x + 7} ${y}`).join(' '), {
      width: 2.4
    }),
    group(PUPILS.map(([x, y]) => ellipse(x, y, 7, 7.5)).join(' '), { fill: PAPER, stroke: null })
  ],
  {
    parent: head.ind,
    o: moving(
      [
        [0, [0]],
        [72, [100]],
        [76, [0]],
        [120, [0]]
      ],
      { hold: true }
    )
  }
);

// ─── what is drawn here ─────────────────────────────────────────────────

/**
 * A laptop from behind, in front of him: the lid hides the crossed arms,
 * so the upper arms read as reaching down to the keys. A `</>` sticker, not
 * a fruit — the mark is somebody else's.
 */
const laptop = layer('laptop', [
  group('M246 410 L233 423 L246 436 M280 410 L293 423 L280 436 M268 405 L258 441', {
    width: 3
  }),
  group(
    'M98 352 L428 352 C433 352 436 355 436 360 L442 466 C442 470 439 473 435 473 L91 473 C87 473 84 470 84 466 L90 360 C90 355 93 352 98 352 Z',
    { fill: PAPER }
  ),
  group('M66 473 L460 473 L468 486 C469 489 467 491 464 491 L62 491 C59 491 57 489 58 486 Z', {
    fill: PAPER
  })
]);

/** A mug on the desk, and steam that drifts up off it. */
const mug = layer('mug', [
  group('M516 450 C530 450 530 474 516 474'),
  group('M480 441 L480 486 C480 489 482 491 485 491 L511 491 C514 491 516 489 516 486 L516 441 Z', {
    fill: PAPER
  })
]);
const steam = layer(
  'steam',
  [group('M491 430 C485 420 497 413 491 403 M504 430 C498 420 510 413 504 403', { width: 2.4 })],
  {
    pivot: [498, 430],
    p: moving([
      [0, [498, 436, 0]],
      [120, [498, 420, 0]]
    ]),
    o: moving([
      [0, [0]],
      [30, [100]],
      [90, [100]],
      [120, [0]]
    ])
  }
);

/**
 * What he is typing, as it leaves the screen: small marks that rise off
 * either side of the lid and fade. Drawn about their own origin.
 */
const MARKS = [
  'M-4 -9 Q-8 -9 -8 -5 L-8 -2 Q-8 0 -11 0 Q-8 0 -8 2 L-8 5 Q-8 9 -4 9 M4 -9 Q8 -9 8 -5 L8 -2 Q8 0 11 0 Q8 0 8 2 L8 5 Q8 9 4 9',
  'M-7 -7 L-12 0 L-7 7 M7 -7 L12 0 L7 7 M3 -9 L-3 9',
  'M-6 -2 L-6 2 M0 -2 L0 2 M6 -2 L6 2',
  'M-9 -6 L-3 0 L-9 6 M1 7 L10 7'
];
const glyph = (mark, index, from, to, start) => {
  const at = (t) => Math.min(FRAMES, t);
  return layer(`mark-${index}`, [group(mark, { width: 2.4 })], {
    s: still([160, 160, 100]),
    p: moving([
      [0, [...from, 0]],
      [at(start), [...from, 0]],
      [at(start + 44), [...to, 0]],
      [FRAMES, [...to, 0]]
    ]),
    o: moving([
      [0, [0]],
      [at(start), [0]],
      [at(start + 10), [100]],
      [at(start + 30), [100]],
      [at(start + 44), [0]],
      [FRAMES, [0]]
    ])
  });
};
const marks = [
  glyph(MARKS[0], 0, [62, 330], [34, 250], 0),
  glyph(MARKS[1], 1, [468, 330], [500, 250], 26),
  glyph(MARKS[2], 2, [60, 330], [40, 262], 52),
  glyph(MARKS[3], 3, [470, 330], [498, 248], 72)
];

const animation = {
  v: '5.7.4',
  fr: FPS,
  ip: 0,
  op: FRAMES,
  w: W,
  h: H,
  nm: 'typing',
  ddd: 0,
  assets: [],
  // Top first: marks and steam over everything, the laptop over the arms,
  // the blink over the head.
  layers: [...marks, steam, mug, laptop, blink, head, body]
};

mkdirSync(dirname(OUT), { recursive: true });
// Two decimals is a hundredth of a unit in a 560-unit box — far below a
// device pixel — and it takes the file from ~240KB to a fraction of that.
writeFileSync(
  OUT,
  `${JSON.stringify(animation, (_, value) => (typeof value === 'number' ? Math.round(value * 100) / 100 : value))}\n`
);
console.log(`wrote ${OUT}`);
