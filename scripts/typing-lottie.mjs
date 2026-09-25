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
    [434, 382],
    [460, 382],
    [460, DESK],
    [LID.right, DESK]
  ])
];
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
  masks: [mask(ARM_LEFT), mask(HANDS[0], 's')]
});
const armRight = piece('arm-right', {
  pivot: SHOULDER_RIGHT,
  r: taps(1, 2),
  masks: [mask(ARM_RIGHT), mask(HANDS[1], 's')]
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

// ─── the hands ──────────────────────────────────────────────────────────

/** True while he is typing rather than looking up. */
const typing = (t) => t < TYPE_END || t >= BACK_DOWN + 4;

/**
 * One finger's taps: down a couple of units on its own beats, back up.
 * Staggered by finger and by hand so no two land together.
 */
const fingerTaps = (seed) => {
  const keys = [[0, [0, 0]]];
  for (let t = 3 + ((seed * 7) % 11); t < FRAMES - 4; t += 9 + ((seed * 5) % 7)) {
    if (!typing(t) || !typing(t + 3)) continue;
    keys.push([t, [0, 0]], [t + 2, [0.4, 2.6]], [t + 4, [0, 0]]);
  }
  keys.push([FRAMES, [0, 0]]);
  return moving(keys);
};

/** A group whose whole drawing moves by `p`. */
function moved(d, p, options) {
  const g = group(d, options);
  g.it[g.it.length - 1] = { ...transform(), p };
  return g;
}

/**
 * Forearms along the desk, and hands on the keys at the lid's two front
 * corners. Physically the keyboard is behind the lid; this is the drawing
 * convention every illustration of someone at a laptop uses, because a
 * typist with no hands does not read as typing. Drawn in the traced
 * lines' weight, ink over paper. The watch is on his left wrist, as in
 * the portrait.
 *
 * The left hand is drawn; the right is the same shapes mirrored about the
 * lid's centre.
 */
const AXIS = LID.left + LID.right;
const across = (d) =>
  d.replace(/([MLQC])([^MLQCZ]*)/g, (_, command, args) => {
    const values = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    return `${command}${values.map((v, i) => (i % 2 === 0 ? AXIS - v : v)).join(' ')} `;
  });

/**
 * Lying along the desk from the traced elbow, the wrist lifted onto the
 * laptop. NOT grown with the hand (below): its elbow end has to stay under
 * the traced upper arm, and only its wrist end meets the larger hand.
 */
const FOREARM =
  'M82 398 C104 386 126 378 149 375 L151 398 C128 405 104 415 80 426 C78 416 78 406 82 398 Z';
/** The back of the hand, wrist to knuckles; the fingers come out from under its edge. */
const PALM =
  'M147 386 C160 379 183 377 199 381 C207 383 212 389 210 396 C195 395 172 397 152 405 Z';
const THUMB =
  'M150 398 C157 396 167 402 172 409 C175 414 171 418 166 416 C159 412 153 406 150 398 Z';
const FINGER = (x, length) =>
  `M${x} 392 L${x} ${412 + length} C${x} ${417 + length} ${x + 8.5} ${417 + length} ${x + 8.5} ${412 + length} L${x + 8.5} 392 Z`;
const FINGERS = [
  [172, 2],
  [181, 5],
  [190, 4.5],
  [199, 1]
];
/** On the wrist the forearm meets the hand: a strap round it, the face on top. */
const WATCH =
  'M136 386 L136 407 M147 386 L147 405 M133 391 C133 389 134 388 136 388 L146 388 C148 388 149 389 149 391 L149 402 C149 404 148 405 146 405 L136 405 C134 405 133 404 133 402 Z';

/**
 * The hands are drawn at life size against the traced head and then grown
 * by a third about the desk under the wrist: at the size the figure is
 * shown on the index (~300px wide at 1440) life-size hands were a smudge
 * at the lid's corners. Cartoon hands run large; the line weight does not
 * grow with them, because it is the geometry that is scaled, not the layer.
 */
const HAND_SCALE = 1.35;
const HAND_PIVOT = [158, DESK];
const grow = (d) =>
  d.replace(/([MLQC])([^MLQCZ]*)/g, (_, command, args) => {
    const values = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    const scaled = values.map((v, i) => {
      const c = HAND_PIVOT[i % 2];
      return +(c + (v - c) * HAND_SCALE).toFixed(2);
    });
    return `${command}${scaled.join(' ')} `;
  });

const hand = (name, side, seed) => {
  const draw = side === 'left' ? grow : (d) => across(grow(d));
  return layer(name, [
    ...(side === 'right' ? [group(draw(WATCH), { fill: PAPER, width: 2.4 })] : []),
    group(draw(THUMB), { fill: PAPER, width: 2.4 }),
    group(draw(PALM), { fill: PAPER, width: 2.6 }),
    ...FINGERS.map(([x, length], i) =>
      moved(draw(FINGER(x, length)), fingerTaps(seed + i), { fill: PAPER, width: 2.4 })
    ),
    group(side === 'left' ? FOREARM : across(FOREARM), { fill: PAPER, width: 2.6 })
  ]);
};
const hands = [hand('hand-left', 'left', 1), hand('hand-right', 'right', 6)];

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

/** A mug on the desk, and steam that drifts up off it. */
const MUG = 474;
const mug = layer('mug', [
  group(
    `M${MUG + 36} ${DESK - 36} C${MUG + 50} ${DESK - 36} ${MUG + 50} ${DESK - 12} ${MUG + 36} ${DESK - 12}`
  ),
  group(
    `M${MUG} ${DESK - 45} L${MUG} ${DESK - 3} C${MUG} ${DESK - 1} ${MUG + 2} ${DESK + 1} ${MUG + 5} ${DESK + 1} L${MUG + 31} ${DESK + 1} C${MUG + 34} ${DESK + 1} ${MUG + 36} ${DESK - 1} ${MUG + 36} ${DESK - 3} L${MUG + 36} ${DESK - 45} Z`,
    { fill: PAPER }
  )
]);
const steam = layer(
  'steam',
  [
    group(
      `M${MUG + 11} ${DESK - 56} C${MUG + 5} ${DESK - 66} ${MUG + 17} ${DESK - 73} ${MUG + 11} ${DESK - 83} M${MUG + 24} ${DESK - 56} C${MUG + 18} ${DESK - 66} ${MUG + 30} ${DESK - 73} ${MUG + 24} ${DESK - 83}`,
      { width: 2.4 }
    )
  ],
  {
    pivot: [MUG + 18, DESK - 56],
    p: moving([
      [0, [MUG + 18, DESK - 50, 0]],
      [FRAMES, [MUG + 18, DESK - 68, 0]]
    ]),
    o: moving([
      [0, [0]],
      [36, [100]],
      [114, [100]],
      [FRAMES, [0]]
    ])
  }
);

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
    ...hands,
    laptop,
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
