/**
 * Writes `public/lottie/typing.json` — the owner at his MacBook, typing —
 * the animation over the index's masthead.
 *
 * **The picture is the owner's own illustration, traced, not redrawn.**
 * `scripts/portrait/typing.png` is the drawing he supplied — him at a
 * MacBook with a mug beside it — and `scripts/portrait/trace.py` vectorises
 * its lines into `scripts/portrait/paths.json` (the lid's logo masked out
 * first; it is somebody else's mark). This script puts those exact lines on
 * the page and makes them move:
 *
 * - his hands, at the lid's lower corners, tap on the keys in turn;
 * - his head bobs a little while he types, and lifts when he looks up;
 * - his eyes are on the screen, blink, glance at the reader, go back;
 * - steam drifts off the mug, and marks of what he types rise and fade.
 *
 * Every moving part is the SAME traced drawing under a different mask, so
 * at rest they add up to it pixel for pixel, and each turns about the
 * point where its cut is — the wrist, the neck — where a degree of turn
 * moves the cut by less than the line is wide.
 *
 * It also writes `public/lottie/wave.json`, what `Typist` plays when the
 * figure is clicked: his second illustration, `waving.png`, one hand up,
 * traced the same way and set down on THIS drawing's laptop and mug, the
 * hand waving about the wrist. See "the wave" at the foot of the file.
 *
 * Only the site's two inks are used, copied from `global.css` (trap 7:
 * they are copies — re-run after a palette change). `Typist` plays whatever
 * Lottie sits at the two output paths, so a designer's file can replace
 * either, as long as the two share one canvas.
 *
 *   node scripts/typing-lottie.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '../public/lottie/typing.json');
const WAVE_OUT = resolve(HERE, '../public/lottie/wave.json');
const read = (name) => JSON.parse(readFileSync(resolve(HERE, 'portrait', name), 'utf8'));
const PORTRAIT = read('paths.json');

const FPS = 30;
const FRAMES = 150; // one 5s loop

/**
 * Everything below is written in the traced image's own pixels, so a number
 * can be checked against `typing.png` directly; `SHIFT` then crops that
 * image down to its ink, with a margin for the marks and the steam.
 *
 * The crop reaches 140px further left than the typing figure needs, and
 * that is the wave's: its hand goes up and out past his shoulder (below).
 * `Typist` lays the two files over each other in one box, so they have to
 * share one canvas to the unit, or the laptop would move between them.
 */
const SHIFT = [-10, -8];
const W = 1370;
const H = 1000;

/** `--ink` and `--paper`, as Lottie's 0–1 channels. */
const hex = (value) => [1, 3, 5].map((at) => Number.parseInt(value.slice(at, at + 2), 16) / 255);
const INK = [...hex('#14110f'), 1];
const PAPER = [...hex('#efedea'), 1];
/** The traced lines are about this heavy; what is drawn here matches. */
const LINE = 5;

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

/** Put every point of an absolute path through `place`, a point to a point. */
const mapPath = (d, place) =>
  d.replace(/([MLQC])([^MLQCZ]*)/g, (_, command, args) => {
    const values = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    const moved = [];
    for (let index = 0; index < values.length; index += 2) {
      moved.push(...place([values[index], values[index + 1]]).map((value) => +value.toFixed(2)));
    }
    return `${command}${moved.join(' ')} `;
  });
/** Move every point of an absolute path. */
const shift = (d, [dx, dy]) => mapPath(d, ([x, y]) => [x + dx, y + dy]);

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
function layer(name, groups, { pivot = [0, 0], parent, r, p, s, o, masks, op = FRAMES } = {}) {
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
    op,
    st: 0,
    bm: 0
  };
}

/**
 * The drawing is traced ONCE, as an asset, and every piece of it is a
 * precomp layer onto it under its own mask — a copy of the traced
 * paths per piece would be four times the file.
 */
function piece(name, { refId = 'portrait', ...options } = {}) {
  const base = layer(name, [], options);
  delete base.shapes;
  return { ...base, ty: 0, refId, w: W, h: H };
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

/** Image pixels to composition units. */
const at = ([x, y]) => [x + SHIFT[0], y + SHIFT[1]];
const cut = (points) => poly(points.map(at));

// ─── the drawing ────────────────────────────────────────────────────────

/** Every traced line, as one even-odd ink fill — holes stay holes. */
const drawing = () =>
  group(PORTRAIT.paths.map((d) => shift(d, SHIFT)).join(' '), {
    fill: INK,
    stroke: null,
    evenOdd: true
  });

/**
 * The head: above a cut across the neck, just under the chin. The neck's
 * two lines are near vertical where the cut crosses them, so a nod about
 * the chin slides each cut end ALONG its own line — nothing to see.
 */
const HEAD_OUTLINE = [
  [395, 0],
  [800, 0],
  [800, 330],
  [712, 335],
  [705, 378],
  [680, 380],
  [640, 425],
  [600, 436],
  [560, 428],
  [528, 410],
  [505, 408],
  [430, 360],
  [395, 300]
];
const HEAD = cut(HEAD_OUTLINE);
/**
 * What the rest of the drawing gives up to the head is a few pixels LESS
 * than the head takes, so the two overlap in a band across the neck. At
 * rest the band is the same line drawn twice, in the same place; mid-nod
 * it is a line a hair thicker — where a cut that met exactly would have
 * opened a hairline of paper across it.
 */
const HEAD_KEEP = cut(HEAD_OUTLINE.map(([x, y]) => [x, y >= 370 ? y - 8 : y]));
const CHIN = at([605, 420]);

/**
 * The hands, where they show at the lid's lower corners: each window hugs
 * the hand's own outline, between the cuff above it, the fold of the sleeve
 * beside it. Measured off the trace, row by row — each edge sits in the
 * paper between two lines, never on one.
 *
 * The bottom edge takes in the stretch of desk line under the hand, and the
 * rest of the drawing keeps it too. At rest that is one line drawn twice;
 * lifted, the copy goes up with the hand and closes it off along the
 * bottom, so a raised hand is a whole hand rather than an arc with its foot
 * left behind on the desk.
 */
const HAND_LEFT_OUTLINE = [
  [265, 962],
  [256, 918],
  [266, 890],
  [282, 872],
  [300, 861],
  [330, 856],
  [346, 860],
  [354, 860],
  [354, 962]
];
const HAND_LEFT = cut(HAND_LEFT_OUTLINE);
const HAND_RIGHT_OUTLINE = [
  [970, 962],
  [970, 862],
  [990, 861],
  [1010, 864],
  [1030, 872],
  [1050, 890],
  [1058, 915],
  [1050, 962]
];
const HAND_RIGHT = cut(HAND_RIGHT_OUTLINE);
/** What the rest gives up to each hand: the same window, above the desk. */
const aboveDesk = (points) => cut(points.map(([x, y]) => [x, Math.min(y, 954)]));
const HAND_LEFT_KEEP = aboveDesk(HAND_LEFT_OUTLINE);
const HAND_RIGHT_KEEP = aboveDesk(HAND_RIGHT_OUTLINE);
/** Where each hand meets its cuff and the lid: the wrist, what it turns on. */
const WRIST_LEFT = at([356, 862]);
const WRIST_RIGHT = at([968, 866]);

/**
 * Typing: each hand lifts off the desk and comes down again about its
 * wrist, a few degrees, in short beats, the two out of step as hands on
 * keys are. Its fingers are on the far side of the lid, so what a reader
 * sees is the back of the hand rising and falling. Still while he looks
 * up. `sign` is which way is up for that hand.
 */
const taps = (sign, offset) => {
  const beat = (t) => [t, [(Math.floor((t - offset) / 4) % 2 ? 4.5 : 0) * sign]];
  const keys = [[0, [0]]];
  for (let t = offset + 2; t < TYPE_END - 2; t += 4 + ((t * 7) % 3)) keys.push(beat(t));
  keys.push([TYPE_END, [0]], [BACK_DOWN + 4, [0]]);
  for (let t = BACK_DOWN + 6 + offset; t < FRAMES - 4; t += 4 + ((t * 7) % 3)) keys.push(beat(t));
  keys.push([FRAMES, [0]]);
  return moving(keys);
};

/** A small bob with the typing; the chin lifts when he looks up. */
const nod = moving([
  [0, [0.4]],
  [24, [0.9]],
  [48, [0.2]],
  [72, [0.8]],
  [TYPE_END, [0.4]],
  [LOOK_UP[0] + 6, [-1]],
  [LOOK_UP[1], [-0.8]],
  [BACK_DOWN + 4, [0.4]],
  [FRAMES, [0.4]]
]);

const head = piece('head', { pivot: CHIN, r: nod, masks: [mask(HEAD)] });
const handLeft = piece('hand-left', {
  pivot: WRIST_LEFT,
  r: taps(1, 0),
  masks: [mask(HAND_LEFT)]
});
const handRight = piece('hand-right', {
  pivot: WRIST_RIGHT,
  r: taps(-1, 2),
  masks: [mask(HAND_RIGHT)]
});
/** Everything else: the whole drawing, less the pieces that move. */
const scene = piece('scene', {
  masks: [
    mask(
      poly([
        [0, 0],
        [W, 0],
        [W, H],
        [0, H]
      ])
    ),
    mask(HEAD_KEEP, 's'),
    mask(HAND_LEFT_KEEP, 's'),
    mask(HAND_RIGHT_KEEP, 's')
  ]
});

/**
 * The eyes. The traced pupils are covered with paper for good and drawn
 * again, on the head, so they can move: down to the screen while he types,
 * back to the reader — where the drawing has them — while he looks up.
 */
const PUPILS = [at([510, 255]), at([621, 233])];
const whites = layer(
  'whites',
  [
    group(PUPILS.map(([x, y]) => ellipse(x, y + 1, 10, 10.5)).join(' '), {
      fill: PAPER,
      stroke: null
    })
  ],
  { parent: head.ind }
);
const AT_SCREEN = [0, 3];
const AT_READER = [0, 0];
const pupils = layer(
  'pupils',
  [group(PUPILS.map(([x, y]) => ellipse(x, y, 8.5, 10.5)).join(' '), { fill: INK, stroke: null })],
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
/** A blink: the eye on paper, and a closed lid across it, for four frames. */
const blink = layer(
  'blink',
  [
    group(
      PUPILS.map(([x, y]) => `M${x - 13} ${y + 1} Q${x} ${y + 8} ${x + 13} ${y + 1}`).join(' '),
      {
        width: 4
      }
    ),
    group(PUPILS.map(([x, y]) => ellipse(x, y, 14, 14)).join(' '), { fill: PAPER, stroke: null })
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

// ─── what is drawn here ─────────────────────────────────────────────────

/**
 * Steam off the mug. The illustration's own steam is grey, which is not one
 * of this site's two inks, so it was left out of the trace and is drawn here
 * in ink, where it can move: three wisps rising off the rim, thinning out.
 */
const RIM = at([1213, 792]);
const STEAM = [-30, 0, 30]
  .map((dx, i) => {
    const x = RIM[0] + dx;
    const y = RIM[1] - 18 + (i === 1 ? 4 : 0);
    const top = y - (i === 1 ? 84 : 70);
    return `M${x} ${y} C${x - 14} ${y - 24} ${x + 14} ${y - 46} ${x} ${top}`;
  })
  .join(' ');
const steam = layer('steam', [group(STEAM, { width: 4 })], {
  pivot: [RIM[0], RIM[1] - 18],
  p: moving([
    [0, [RIM[0], RIM[1] - 8, 0]],
    [FRAMES, [RIM[0], RIM[1] - 40, 0]]
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
 * either side of him into the paper and fade. Only while he types.
 */
const MARKS = [
  'M-4 -9 Q-8 -9 -8 -5 L-8 -2 Q-8 0 -11 0 Q-8 0 -8 2 L-8 5 Q-8 9 -4 9 M4 -9 Q8 -9 8 -5 L8 -2 Q8 0 11 0 Q8 0 8 2 L8 5 Q8 9 4 9',
  'M-7 -7 L-12 0 L-7 7 M7 -7 L12 0 L7 7 M3 -9 L-3 9',
  'M-6 -2 L-6 2 M0 -2 L0 2 M6 -2 L6 2',
  'M-9 -6 L-3 0 L-9 6 M1 7 L10 7'
];
const glyph = (mark, index, from, to, start) => {
  const clamp = (t) => Math.min(FRAMES, t);
  return layer(`mark-${index}`, [group(mark, { width: 2.4 })], {
    s: still([280, 280, 100]),
    p: moving([
      [0, [...at(from), 0]],
      [clamp(start), [...at(from), 0]],
      [clamp(start + 44), [...at(to), 0]],
      [FRAMES, [...at(to), 0]]
    ]),
    o: moving([
      [0, [0]],
      [clamp(start), [0]],
      [clamp(start + 10), [100]],
      [clamp(start + 30), [100]],
      [clamp(start + 44), [0]],
      [FRAMES, [0]]
    ])
  });
};
const marks = [
  glyph(MARKS[0], 0, [320, 440], [250, 290], 4),
  glyph(MARKS[1], 1, [900, 420], [980, 270], 26),
  glyph(MARKS[2], 2, [310, 450], [260, 320], 50),
  glyph(MARKS[3], 3, [910, 420], [970, 290], 102)
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
      layers: [{ ...layer('drawing', [drawing()]), ind: 1 }]
    }
  ],
  // Top first: marks and steam over everything, the eyes over the head.
  layers: [...marks, steam, blink, pupils, whites, head, handLeft, handRight, scene]
};

// Two decimals is a hundredth of a unit in a 1370-unit box — far below a
// device pixel — and it takes the file from ~240KB to a fraction of that.
const write = (file, data) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(
    file,
    `${JSON.stringify(data, (_, value) => (typeof value === 'number' ? Math.round(value * 100) / 100 : value))}\n`
  );
  console.log(`wrote ${file}`);
};
write(OUT, animation);

// ─── the wave ───────────────────────────────────────────────────────────

/**
 * What `Typist` plays when the figure is clicked: he looks up and waves.
 *
 * **It is his second illustration, `waving.png`, traced like the first**
 * (logo masked out): hand up, mouth open. `Typist` lays it over the typing
 * file in the same box and fades between the two, so it has to be set down
 * on the SAME laptop — the furniture here is not the waving drawing's but
 * this one's, the typing drawing's lid, base and mug clipped out of it, and
 * so when one file gives way to the other only the person changes. The
 * desk line is the waving drawing's, cut to where this one's runs, because
 * his arm rests on it.
 */
const WAVING = read('waving-paths.json');
/** Written by `region.py`: the inside of the raised hand, grown and cut. */
const REGIONS = read('waving-regions.json');
const WAVE_FRAMES = 54; // 1.8s

/**
 * `waving.png`'s pixels onto `typing.png`'s. Across, its lid's outer edges
 * (402, 1006) onto this lid's (352, 972). Down, its desk line (943) onto
 * this one (959.5), at the ratio of the two heads, hair to chin (371.5
 * against 389). So he sits at the same desk at the same size and comes up
 * a little taller to wave — and the two scales differ by 2%, which a line
 * drawing does not show.
 */
const WAVE_SX = (972 - 352) / (1006 - 402);
const WAVE_SY = (425 - 36) / (408.5 - 37);
const onTyping = ([x, y]) => [352 + (x - 402) * WAVE_SX, 959.5 + (y - 943) * WAVE_SY];
/** `waving.png`'s pixels to composition units, as `at` is for `typing.png`'s. */
const atWave = (point) => at(onTyping(point));
const cutWave = (points) => poly(points.map(atWave));
const placeWave = (d) => mapPath(d, atWave);

const wavingDrawing = () =>
  group(WAVING.paths.map(placeWave).join(' '), { fill: INK, stroke: null, evenOdd: true });

/**
 * The furniture, in `typing.png`'s pixels. What the typing drawing lends
 * the wave is its laptop, lid and base together, and its mug; what the
 * waving drawing gives up is its own laptop — lid, base and the desk line
 * behind them — where his lines meet it.
 *
 * **The lid is not a rectangle.** Its sides lean in going down, 9px over
 * its height (outer edge 350 at y = 590 to 359 at 950 on the left, 974 to
 * 965 on the right), so both cuts are trapezoids on those edges. Cut
 * square, the lent lid brought the ends of the TYPING sleeves along as
 * ticks on its lower sides, and the waving drawing's own lid, which leans
 * in more and so stands 1.6px proud of this one near the top, showed as a
 * second edge beside it. The lent lid stops half a pixel outside its ink;
 * what his drawing gives up reaches a pixel and a half further, past the
 * edge of his own lid.
 */
const LAPTOP = [
  [349, 571],
  [976, 571],
  [966.3, 959],
  [990, 959],
  [990, 984],
  [334, 984],
  [334, 959],
  [358.7, 959]
];
const MUG = [
  [1128, 785],
  [1356, 785],
  [1356, 1000],
  [1128, 1000]
];
const BEHIND_LAPTOP = [
  [347.6, 572],
  [977, 572],
  [967.3, 959],
  [992, 959],
  [992, 996],
  [332, 996],
  [332, 959],
  [357.2, 959]
];
/** His mug, and the desk line past where this drawing's ends (192 to 1116,
 * which is where his right sleeve comes down on it). */
const NOT_HIS = [
  [
    [1120, 700],
    [1400, 700],
    [1400, 1010],
    [1120, 1010]
  ],
  [
    [0, 945],
    [192, 945],
    [192, 975],
    [0, 975]
  ],
  [
    [1116, 945],
    [1400, 945],
    [1400, 975],
    [1116, 975]
  ]
];

/**
 * The raised hand waves about the wrist. Below the hand his forearm is a
 * straight band leaning 17° off upright — both edges at the same slope, 75px
 * apart — and the cut runs square ACROSS that band, (243, 520) to (318,
 * 543) in `waving.png`, not level. Turned about the middle of a square cut,
 * each cut end moves along the band, which is along its own edge: at the
 * full swing out it strays from the line by about a pixel. A level cut
 * across the same wrist broke both edges by ~3 units at that swing — that
 * was the first render. The rest gives up the hand only as far as a
 * parallel line 12px nearer the hand, so the band between is drawn twice:
 * one line at rest, a hair thicker mid-swing, never a gap. 12 and not 8
 * because at the full swing out the cut's outer end draws back up the band
 * by 39·sin 14° = 9.4px, and 8 left a white notch across that edge.
 *
 * The hand is outlined only, so on its own it would show the shoulder line
 * through its palm on the swing in. `hand-fill` is the paper inside it,
 * turning with it underneath its ink.
 */
const WRIST = [280.5, 531.5];
/** The two marks beside his fingers, as drawn: they flick on at each swing out. */
const ARCS = [
  [148, 282],
  [208, 282],
  [208, 372],
  [148, 372]
];
/** Out is anticlockwise, away from him; in stops short of the shoulder line. */
const SWING_OUT = -14;
const SWING_IN = 5;
const swing = moving([
  [0, [0]],
  [6, [SWING_OUT]],
  [12, [SWING_IN]],
  [18, [SWING_OUT]],
  [24, [SWING_IN]],
  [30, [SWING_OUT]],
  [37, [3]],
  [44, [0]],
  [WAVE_FRAMES, [0]]
]);
/** On at the first frame — the still pose is the drawing as he drew it. */
const flicks = moving([
  [0, [100]],
  [3, [0]],
  [4, [0]],
  [6, [100]],
  [9, [0]],
  [16, [0]],
  [18, [100]],
  [21, [0]],
  [28, [0]],
  [30, [100]],
  [33, [0]],
  [WAVE_FRAMES, [0]]
]);

nextIndex = 1;
const waveOptions = { refId: 'waving', op: WAVE_FRAMES };
const hand = piece('hand', {
  ...waveOptions,
  pivot: atWave(WRIST),
  r: swing,
  masks: [mask(placeWave(REGIONS.hand))]
});
const handFill = layer(
  'hand-fill',
  [group(placeWave(REGIONS['hand-fill']), { fill: PAPER, stroke: null })],
  { parent: hand.ind, op: WAVE_FRAMES }
);
const arcs = piece('arcs', {
  ...waveOptions,
  parent: hand.ind,
  o: flicks,
  masks: [mask(cutWave(ARCS))]
});
const body = piece('body', {
  ...waveOptions,
  masks: [
    mask(
      poly([
        [0, 0],
        [W, 0],
        [W, H],
        [0, H]
      ])
    ),
    mask(cut(BEHIND_LAPTOP), 's'),
    ...NOT_HIS.map((points) => mask(cut(points), 's')),
    mask(placeWave(REGIONS['hand-keep']), 's'),
    mask(cutWave(ARCS), 's')
  ]
});
const furniture = piece('furniture', {
  op: WAVE_FRAMES,
  masks: [mask(cut(LAPTOP)), mask(cut(MUG))]
});
/** The same steam off the same mug, mid-drift, so it carries on through. */
const waveSteam = layer('steam', [group(STEAM, { width: 4 })], {
  pivot: [RIM[0], RIM[1] - 18],
  p: moving([
    [0, [RIM[0], RIM[1] - 16, 0]],
    [WAVE_FRAMES, [RIM[0], RIM[1] - 28, 0]]
  ]),
  op: WAVE_FRAMES
});

write(WAVE_OUT, {
  v: '5.7.4',
  fr: FPS,
  ip: 0,
  op: WAVE_FRAMES,
  w: W,
  h: H,
  nm: 'wave',
  ddd: 0,
  assets: [
    { id: 'portrait', layers: [{ ...layer('drawing', [drawing()]), ind: 1 }] },
    { id: 'waving', layers: [{ ...layer('drawing', [wavingDrawing()]), ind: 1 }] }
  ],
  // Top first: the hand over its own paper, over him, over the furniture.
  layers: [waveSteam, arcs, hand, handFill, body, furniture]
});
