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
const H = 460;
const FPS = 30;
const FRAMES = 150; // one 5s loop

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

/**
 * The portrait is drawn ONCE, as an asset, and every piece of him is a
 * precomp layer onto it under its own mask — four copies of the traced
 * paths would be four times the file.
 */
function piece(name, options) {
  const base = layer(name, [], options);
  delete base.shapes;
  return { ...base, ty: 0, refId: 'portrait', w: W, h: H };
}

// ─── timing ─────────────────────────────────────────────────────────────

/**
 * One loop, as a small story: he types, looking down at the screen; blinks;
 * glances up at the reader for a moment; looks back down and carries on.
 */
const TYPE_END = 96;
const BLINK = [96, 100];
const LOOK_UP = [100, 126];
const BACK_DOWN = 132;

// ─── the portrait ───────────────────────────────────────────────────────

/** Every traced line, as one even-odd ink fill — holes stay holes. */
const portrait = () =>
  group(PORTRAIT.paths.map((d) => shift(d, SHIFT)).join(' '), {
    fill: INK,
    stroke: null,
    evenOdd: true
  });

/**
 * The traced drawing is one connected shape, so it is cut into pieces by
 * MASKS rather than by editing lines: every piece is the whole drawing
 * under a different window, so at rest they add up to it pixel for pixel.
 *
 * The head: above the collar points and the chin.
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

/** Where the desk is. The traced shirt runs on below it, out of sight. */
const DESK = 426;
const ABOVE_DESK = poly([
  [0, 0],
  [W, 0],
  [W, DESK],
  [0, DESK]
]);

/**
 * The arms, outside the lid. Each window's inner edge runs under the lid
 * from its top down, so the only stretch of cut anyone can see is the few
 * pixels above the lid by the shoulder — which is where each arm turns
 * about, so it barely moves there.
 */
const LID = { left: 124, right: 394, top: 252 };
const ARM_LEFT = poly([
  [0, 232],
  [112, 232],
  [LID.left + 6, LID.top + 4],
  [LID.left + 6, DESK],
  [0, DESK]
]);
const ARM_RIGHT = poly([
  [398, 226],
  [W, 226],
  [W, DESK],
  [LID.right - 6, DESK],
  [LID.right - 6, LID.top + 4]
]);
/**
 * The crossed arms' hands, which the portrait has folded in front of him,
 * peek out either side of the lid. Cut away: from behind a laptop his
 * hands are on its keys, where nobody can see them.
 */
const HANDS = [
  poly([
    [100, 358],
    [LID.left, 358],
    [LID.left, DESK],
    [100, DESK]
  ]),
  poly([
    [LID.right, 330],
    [434, 330],
    [434, DESK],
    [LID.right, DESK]
  ])
];
/**
 * The traced arms from just below the shoulder down, taken away: the drawn
 * sleeves (below) replace them, starting exactly where these cuts are.
 */
const BELOW_SHOULDER = {
  left: poly([
    [0, 292],
    [LID.left + 10, 292],
    [LID.left + 10, DESK + 4],
    [0, DESK + 4]
  ]),
  right: poly([
    [LID.right - 10, 298],
    [W, 298],
    [W, DESK + 4],
    [LID.right - 10, DESK + 4]
  ])
};
const SHOULDER_LEFT = [106, 250];
const SHOULDER_RIGHT = [404, 246];

/**
 * Typing, from the front: each arm turns a degree or so about its shoulder
 * in short beats, the two out of step, as hands on keys do. Still while he
 * looks up.
 */
const taps = (sign, offset) => {
  const keys = [[0, [0]]];
  for (let t = offset; t < TYPE_END; t += 5)
    keys.push([t, [(Math.floor(t / 5) % 2 ? 1 : -0.4) * sign * 0.5]]);
  keys.push([TYPE_END + 2, [0]], [BACK_DOWN + 2, [0]]);
  for (let t = BACK_DOWN + 4 + offset; t < FRAMES - 2; t += 5) {
    keys.push([t, [(Math.floor(t / 5) % 2 ? 1 : -0.4) * sign * 0.5]]);
  }
  keys.push([FRAMES, [0]]);
  return moving(keys);
};

/** A small bob while typing; a tilt of the head while he looks up. */
const nod = moving([
  [0, [0.6]],
  [24, [1.2]],
  [48, [0.4]],
  [72, [1.1]],
  [TYPE_END, [0.6]],
  [LOOK_UP[0] + 6, [-1.8]],
  [LOOK_UP[1], [-1.4]],
  [BACK_DOWN + 4, [0.6]],
  [FRAMES, [0.6]]
]);

const head = piece('head', { pivot: NECK, r: nod, masks: [mask(HEAD)] });
const armLeft = piece('arm-left', {
  pivot: SHOULDER_LEFT,
  r: taps(-1, 0),
  masks: [mask(ARM_LEFT), mask(HANDS[0], 's'), mask(BELOW_SHOULDER.left, 's')]
});
const armRight = piece('arm-right', {
  pivot: SHOULDER_RIGHT,
  r: taps(1, 2),
  masks: [mask(ARM_RIGHT), mask(HANDS[1], 's'), mask(BELOW_SHOULDER.right, 's')]
});
const torso = piece('torso', {
  masks: [mask(ABOVE_DESK), mask(HEAD, 's'), mask(ARM_LEFT, 's'), mask(ARM_RIGHT, 's')]
});

/**
 * The eyes. The traced pupils are covered with paper for good, and drawn
 * again here so they can move: down and in, at the screen, while he types;
 * straight out, at the reader, while he looks up. All on the head.
 */
const PUPILS = [
  [189, 121],
  [240, 111.5]
];
const whites = layer(
  'whites',
  [group(PUPILS.map(([x, y]) => ellipse(x, y, 6.5, 7.5)).join(' '), { fill: PAPER, stroke: null })],
  { parent: head.ind }
);
const AT_SCREEN = [1.5, 4.5];
const AT_READER = [0, 0];
const pupils = layer(
  'pupils',
  [group(PUPILS.map(([x, y]) => ellipse(x, y, 3.6, 4.8)).join(' '), { fill: INK, stroke: null })],
  {
    parent: head.ind,
    p: moving([
      [0, [...AT_SCREEN, 0]],
      [LOOK_UP[0], [...AT_SCREEN, 0]],
      [LOOK_UP[0] + 4, [...AT_READER, 0]],
      [LOOK_UP[1], [...AT_READER, 0]],
      [BACK_DOWN, [...AT_SCREEN, 0]],
      [FRAMES, [...AT_SCREEN, 0]]
    ])
  }
);
/** A blink: a closed lid across each eye, on paper, for four frames. */
const blink = layer(
  'blink',
  [
    group(PUPILS.map(([x, y]) => `M${x - 7} ${y} Q${x} ${y + 4} ${x + 7} ${y}`).join(' '), {
      width: 2.4
    }),
    group(PUPILS.map(([x, y]) => ellipse(x, y, 7.5, 8.5)).join(' '), { fill: PAPER, stroke: null })
  ],
  {
    parent: head.ind,
    o: moving(
      [
        [0, [0]],
        [BLINK[0], [100]],
        [BLINK[1], [0]],
        [FRAMES, [0]]
      ],
      { hold: true }
    )
  }
);

// ─── the forearms ───────────────────────────────────────────────────────

/**
 * No hands: he types on keys on the far side of the lid, so a hand a
 * reader could see is a hand that is not typing. Four builds of drawn
 * hands were thrown out at the owner's word — in front of the lid, as
 * capsule fingers, peeking past the lid's edges — and then an arm that
 * was the traced upper arm with a forearm bolted on at the desk, whose
 * elbow read as wrong. What shows now is the arm, drawn as a sleeve.
 */
/**
 * Each arm below the shoulder is drawn whole — upper arm, elbow and
 * forearm as ONE sleeve — rather than the traced upper arm with a
 * forearm stuck on at the desk, which read as two parts meeting at an
 * angle no elbow makes. The traced line is kept down to where it leaves
 * the shoulder, and the new contour starts ON it and carries it down:
 * the upper arm hangs to a rounded elbow resting on the desk, the inner
 * line of the arm folds into a crease at the inside of the elbow, and
 * the forearm runs from there, forward and in, until the lid's edge cuts
 * it off. A paper silhouette hides the traced crossed arms beneath it;
 * the sleeve's folds are loose strokes, as the portrait draws them.
 *
 * Drawn per side, not mirrored: the portrait's arms are crossed, so its
 * right upper arm splays out further than its left, and each contour has
 * to start on its own traced line.
 */
const ARMS = {
  left: {
    fill: `M86 292 C80 312 77 342 75 372 C73 394 70 410 72 418 C74 425 80 ${DESK + 2} 90 ${DESK + 2} L${LID.left + 10} ${DESK + 2} L${LID.left + 10} 394 C118 393 108 392 103 388 C105 362 110 320 115 292 Z`,
    contour: `M86 292 C80 312 77 342 75 372 C73 394 70 410 72 418 C74 425 80 ${DESK + 2} 90 ${DESK + 2} L${LID.left + 4} ${DESK + 2} M115 292 C110 320 105 362 103 388 C109 392 116 393 ${LID.left + 4} 394`,
    folds:
      'M89 332 C93 342 95 354 94 366 M80 403 C85 407 90 408 96 406 M83 414 C89 417 96 417 103 414 M108 403 C113 407 118 408 123 407'
  },
  right: {
    fill: `M423 298 C430 315 437 340 444 358 C452 378 458 398 458 412 C458 422 452 ${DESK + 2} 442 ${DESK + 2} L${LID.right - 10} ${DESK + 2} L${LID.right - 10} 394 C400 393 410 392 416 388 C412 364 408 334 404 306 Z`,
    contour: `M423 298 C430 315 437 340 444 358 C452 378 458 398 458 412 C458 422 452 ${DESK + 2} 442 ${DESK + 2} L${LID.right - 4} ${DESK + 2} M404 306 C408 334 412 364 416 388 C410 392 402 393 ${LID.right - 4} 394`,
    folds:
      'M426 334 C428 346 432 356 437 364 M452 404 C446 408 440 409 434 407 M450 415 C444 418 436 418 429 415 M412 403 C407 407 402 408 397 407'
  }
};

const arm = (name, side, parent) =>
  layer(
    name,
    [
      group(ARMS[side].folds, { width: 2.2 }),
      group(ARMS[side].contour, { width: 2.8 }),
      group(ARMS[side].fill, { fill: PAPER, stroke: null })
    ],
    { parent: parent.ind }
  );
const forearms = [
  arm('arm-drawn-left', 'left', armLeft),
  arm('arm-drawn-right', 'right', armRight)
];

// ─── what is drawn here ─────────────────────────────────────────────────

/**
 * A MacBook from behind, in front of him — at a MacBook's proportions: the
 * lid about 1.5 times as wide as it stands tall (a little less, tipped back
 * away from us), corners rounded, a hinge bar across its foot and the thin
 * base below. No logo — the mark is somebody else's — and a `</>` sticker
 * off-centre, the way a sticker actually goes on.
 */
const lid = `M${LID.left + 12} ${LID.top} L${LID.right - 12} ${LID.top} C${LID.right - 5} ${LID.top} ${LID.right} ${LID.top + 5} ${LID.right} ${LID.top + 12} L${LID.right} ${DESK - 12} L${LID.left} ${DESK - 12} L${LID.left} ${LID.top + 12} C${LID.left} ${LID.top + 5} ${LID.left + 5} ${LID.top} ${LID.left + 12} ${LID.top} Z`;
const hinge = `M${LID.left + 10} ${DESK - 12} L${LID.right - 10} ${DESK - 12} L${LID.right - 10} ${DESK - 6} L${LID.left + 10} ${DESK - 6} Z`;
const base = `M${LID.left - 8} ${DESK - 6} L${LID.right + 8} ${DESK - 6} C${LID.right + 11} ${DESK - 6} ${LID.right + 12} ${DESK - 4} ${LID.right + 12} ${DESK - 2} L${LID.right + 12} ${DESK} C${LID.right + 12} ${DESK + 2} ${LID.right + 10} ${DESK + 3} ${LID.right + 7} ${DESK + 3} L${LID.left - 7} ${DESK + 3} C${LID.left - 10} ${DESK + 3} ${LID.left - 12} ${DESK + 2} ${LID.left - 12} ${DESK} L${LID.left - 12} ${DESK - 2} C${LID.left - 12} ${DESK - 4} ${LID.left - 11} ${DESK - 6} ${LID.left - 8} ${DESK - 6} Z`;
const sticker = 'M334 318 L326 326 L334 334 M354 318 L362 326 L354 334 M347 315 L341 337';

const laptop = layer('laptop', [
  group(sticker, { width: 2.4 }),
  group(`${hinge}`, { fill: PAPER, width: 2.2 }),
  group(lid, { fill: PAPER }),
  group(base, { fill: PAPER, width: 2.4 })
]);

/**
 * A coffee mug on the desk, and steam that drifts up off it. Drawn as a
 * mug and not a box: seen a little from above, so the rim is an ellipse
 * with the coffee showing in it; the body tapers slightly to a rounded
 * foot; the handle has a thickness, an outer and an inner loop; and one
 * light stroke down the body says it is glazed. It stands on the desk
 * line, about four tenths the height of his head, which is a real mug's
 * size beside him — the first one was a thimble.
 */
const MUG = { left: 468, right: 526, rim: DESK - 70 };
const MUG_RX = (MUG.right - MUG.left) / 2;
const MUG_MID = (MUG.left + MUG.right) / 2;
const MUG_BODY = `M${MUG.left} ${MUG.rim} C${MUG.left} ${MUG.rim + 26} ${MUG.left + 1} ${MUG.rim + 44} ${MUG.left + 4} ${DESK - 6} C${MUG.left + 6} ${DESK - 1} ${MUG.left + 10} ${DESK + 1} ${MUG.left + 16} ${DESK + 1} L${MUG.right - 16} ${DESK + 1} C${MUG.right - 10} ${DESK + 1} ${MUG.right - 6} ${DESK - 1} ${MUG.right - 4} ${DESK - 6} C${MUG.right - 1} ${MUG.rim + 44} ${MUG.right} ${MUG.rim + 26} ${MUG.right} ${MUG.rim} Z`;
/** The handle, drawn for a 60-unit mug and scaled to this one. */
const K = (DESK - MUG.rim) / 60;
const MUG_HANDLE = `M${MUG.right - 1 * K} ${MUG.rim + 10 * K} C${MUG.right + 18 * K} ${MUG.rim + 6 * K} ${MUG.right + 25 * K} ${MUG.rim + 30 * K} ${MUG.right + 14 * K} ${MUG.rim + 42 * K} C${MUG.right + 9 * K} ${MUG.rim + 47 * K} ${MUG.right + 3 * K} ${MUG.rim + 48 * K} ${MUG.right - 2 * K} ${MUG.rim + 47 * K} L${MUG.right - 2 * K} ${MUG.rim + 38 * K} C${MUG.right + 2 * K} ${MUG.rim + 38 * K} ${MUG.right + 6 * K} ${MUG.rim + 36 * K} ${MUG.right + 8 * K} ${MUG.rim + 33 * K} C${MUG.right + 12 * K} ${MUG.rim + 26 * K} ${MUG.right + 10 * K} ${MUG.rim + 16 * K} ${MUG.right - 1 * K} ${MUG.rim + 18 * K} Z`;
const MUG_GLAZE = `M${MUG.left + 7} ${MUG.rim + 11} C${MUG.left + 6} ${MUG.rim + 24} ${MUG.left + 6} ${MUG.rim + 36} ${MUG.left + 8} ${MUG.rim + 46}`;
const mug = layer('mug', [
  group(ellipse(MUG_MID, MUG.rim + 1, MUG_RX - 4.5, 4.6), { fill: INK, stroke: null }),
  group(ellipse(MUG_MID, MUG.rim, MUG_RX, 7), { fill: PAPER }),
  group(MUG_GLAZE, { width: 1.8 }),
  group(MUG_BODY, { fill: PAPER }),
  group(MUG_HANDLE, { fill: PAPER, width: 2.6 })
]);

/** Three wisps, rising off the rim and thinning out as they go. */
const STEAM = [-11, 0, 11]
  .map((dx, i) => {
    const x = MUG_MID + dx;
    const y = MUG.rim - 10 + (i === 1 ? 2 : 0);
    const top = y - (i === 1 ? 34 : 28);
    return `M${x} ${y} C${x - 6} ${y - 10} ${x + 6} ${y - 18} ${x} ${top}`;
  })
  .join(' ');
const steam = layer('steam', [group(STEAM, { width: 2.2 })], {
  pivot: [MUG_MID, MUG.rim - 10],
  p: moving([
    [0, [MUG_MID, MUG.rim - 4, 0]],
    [FRAMES, [MUG_MID, MUG.rim - 20, 0]]
  ]),
  o: moving([
    [0, [0]],
    [36, [100]],
    [114, [100]],
    [FRAMES, [0]]
  ])
});

/**
 * What he is typing, as it leaves the screen: small marks that rise off
 * either side of the lid and fade. Only while he types.
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
    s: still([150, 150, 100]),
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
  glyph(MARKS[0], 0, [62, 236], [36, 170], 4),
  glyph(MARKS[1], 1, [470, 232], [498, 166], 26),
  glyph(MARKS[2], 2, [60, 238], [40, 178], 50),
  glyph(MARKS[3], 3, [472, 230], [494, 170], 102)
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
  assets: [
    {
      id: 'portrait',
      layers: [{ ...layer('portrait', [portrait()]), ind: 1 }]
    }
  ],
  // Top first: marks and steam over everything, the laptop over the arms
  // and torso, the eyes over the head.
  layers: [
    ...marks,
    steam,
    mug,
    laptop,
    ...forearms,
    blink,
    pupils,
    whites,
    head,
    armLeft,
    armRight,
    torso
  ]
};

mkdirSync(dirname(OUT), { recursive: true });
// Two decimals is a hundredth of a unit in a 560-unit box — far below a
// device pixel — and it takes the file from ~240KB to a fraction of that.
writeFileSync(
  OUT,
  `${JSON.stringify(animation, (_, value) => (typeof value === 'number' ? Math.round(value * 100) / 100 : value))}\n`
);
console.log(`wrote ${OUT}`);
