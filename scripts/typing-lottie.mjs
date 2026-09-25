/**
 * Writes `public/lottie/typing.json` — the owner at a laptop, typing — the
 * animation over the index's masthead.
 *
 * It is DRAWN here, not exported from After Effects: every shape below is an
 * SVG path in a 400x360 box, converted to Lottie's own bezier form, and the
 * motion is a handful of keyframes. Two reasons to keep it as a script.
 * The drawing is in the site's two inks and nothing else, and a colour
 * change is a re-run rather than a trip through an editor. And the file is
 * replaceable: `Typist` plays whatever Lottie sits at that path, so a
 * designer's version can drop in over this one without a line of code.
 *
 *   node scripts/typing-lottie.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../public/lottie/typing.json');

const W = 400;
const H = 360;
const FPS = 30;
const FRAMES = 120; // one 4s loop

/** `--ink` and `--paper`, as Lottie's 0–1 channels. */
const hex = (value) => [1, 3, 5].map((at) => Number.parseInt(value.slice(at, at + 2), 16) / 255);
const INK = [...hex('#14110f'), 1];
const PAPER = [...hex('#efedea'), 1];
const LINE = 3.2;

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

/** Mirror a path across the figure's centre line, x = 200. */
const mirror = (d) =>
  d.replace(/([MLQC])([^MLQCZ]*)/g, (_, command, args) => {
    const values = args
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean)
      .map(Number);
    const flipped = values.map((value, index) => (index % 2 === 0 ? 400 - value : value));
    return `${command}${flipped.join(' ')} `;
  });

// ─── Lottie plumbing ────────────────────────────────────────────────────

const still = (k) => ({ a: 0, k });
const moving = (keys) => {
  // Two keys on one frame is a jump Lottie does not need spelling out.
  const frames = keys.filter(([t], index) => index === 0 || t !== keys[index - 1][0]);
  return {
    a: 1,
    k: frames.map(([t, s], index) =>
      index === frames.length - 1
        ? { t, s }
        : {
            t,
            s,
            i: { x: s.map(() => 0.45), y: s.map(() => 1) },
            o: { x: s.map(() => 0.55), y: s.map(() => 0) }
          }
    )
  };
};

/** One group: some paths, then how they are painted. */
function group(d, { fill = null, stroke = INK, width = LINE } = {}) {
  const items = path(d).map((ks) => ({ ty: 'sh', ks: still(ks) }));
  if (stroke !== null) {
    items.push({ ty: 'st', c: still(stroke), o: still(100), w: still(width), lc: 2, lj: 2 });
  }
  if (fill !== null) items.push({ ty: 'fl', c: still(fill), o: still(100), r: 1 });
  items.push({
    ty: 'tr',
    p: still([0, 0]),
    a: still([0, 0]),
    s: still([100, 100]),
    r: still(0),
    o: still(100)
  });
  return { ty: 'gr', it: items };
}

let nextIndex = 1;
/** A shape layer. `groups` are listed top first, as Lottie paints them. */
function layer(name, groups, { pivot = [0, 0], parent, r, p, s, o } = {}) {
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
    shapes: groups,
    ip: 0,
    op: FRAMES,
    st: 0,
    bm: 0
  };
}

// ─── the drawing ────────────────────────────────────────────────────────

const HEAD_PIVOT = [200, 178];

const head = layer(
  'head',
  [
    // Hair, solid ink, spiky on top as in his portrait.
    group(
      'M162 108 C155 86 160 68 173 59 Q170 50 176 44 Q180 52 185 53 Q186 42 195 36 Q195 46 199 49 Q204 39 214 36 Q210 45 212 49 Q220 44 229 45 Q223 51 224 56 Q232 57 236 62 Q231 63 230 66 C241 76 244 92 238 108 C235 97 230 89 224 85 C216 90 202 92 189 87 C178 91 169 99 162 108 Z',
      { fill: INK, width: 2.2 }
    ),
    // Glasses: two round rims, the bridge, the arms back to the ears.
    group(
      `${ellipse(185, 118, 11.5, 11)} ${ellipse(215, 118, 11.5, 11)} M196.5 116 Q200 112.5 203.5 116 M173.5 115 L166 112 M226.5 115 L234 112`,
      { width: 2.8 }
    ),
    // Brows, nose, the open smile.
    group('M176 102 Q185 97 193 101 M207 101 Q215 97 224 102 M200 123 Q196.5 133 201.5 135'),
    group('M187 142 Q200 159 213 142 Q200 147 187 142 Z', { fill: INK, width: 2.4 }),
    // Ears, then the face that sits over the neck.
    group(
      'M167 111 C158 106 155 122 159 130 C161 135 165 137 168 135 M233 111 C242 106 245 122 241 130 C239 135 235 137 232 135',
      { fill: PAPER }
    ),
    group(
      'M167 98 C165 128 171 152 187 163 C195 169 205 169 213 163 C229 152 235 128 233 98 C233 72 167 72 167 98 Z',
      { fill: PAPER }
    )
  ],
  {
    pivot: HEAD_PIVOT,
    // A slow nod while he reads what he typed, and back.
    r: moving([
      [0, [0]],
      [30, [-2.2]],
      [60, [0.6]],
      [90, [-1.4]],
      [120, [0]]
    ])
  }
);

// The eyes blink once a loop, squashed about their own line.
const eyes = layer(
  'eyes',
  [group(`${ellipse(185, 119, 2.4, 3)} ${ellipse(215, 119, 2.4, 3)}`, { fill: INK, stroke: null })],
  {
    pivot: [200, 119],
    parent: head.ind,
    s: moving([
      [0, [100, 100, 100]],
      [70, [100, 100, 100]],
      [73, [100, 8, 100]],
      [76, [100, 100, 100]],
      [120, [100, 100, 100]]
    ])
  }
);

const body = layer('body', [
  // The open collar, the tee under it, the placket and a breast pocket.
  group(
    'M188 177 L168 189 L179 208 L186 189 M212 177 L232 189 L221 208 L214 189 M186 180 Q200 197 214 180 M179 208 L175 330 M221 208 L225 330 M228 240 L248 240 L248 258 L238 264 L228 258 Z'
  ),
  // Shirt over the shoulders, with the neck above it.
  group(
    'M191 160 L191 178 M209 160 L209 178 M190 176 C170 182 146 186 136 198 C126 210 121 240 119 300 L119 330 L281 330 L281 300 C279 240 274 210 264 198 C254 186 230 182 210 176 Z',
    { fill: PAPER }
  )
]);

/**
 * An arm: sleeve from the shoulder, elbow out, forearm in to the keyboard
 * behind the lid. It turns about the shoulder in short alternating taps,
 * which from the front is what typing looks like.
 */
const ARM =
  'M139 197 C122 214 109 246 109 276 C109 291 117 299 132 299 L180 299 L180 276 L147 274 C146 256 150 236 155 217 Z';
const CUFF = 'M124 271 L126 299';

const taps = (sign, offset) => {
  const frames = [];
  for (let t = 0; t <= FRAMES; t += 6) {
    const beat = ((t + offset) / 6) % 2 === 0;
    // A longer rest once a loop, so it reads as someone thinking.
    const resting = t >= 60 && t < 84;
    frames.push([t, [resting ? 0 : beat ? sign * 2.4 : sign * -0.6]]);
  }
  return moving(frames);
};

const armLeft = layer('arm-left', [group(CUFF, { width: 2.4 }), group(ARM, { fill: PAPER })], {
  pivot: [142, 202],
  r: taps(-1, 0)
});
const armRight = layer(
  'arm-right',
  [group(mirror(CUFF), { width: 2.4 }), group(mirror(ARM), { fill: PAPER })],
  { pivot: [258, 202], r: taps(1, 6) }
);

// A laptop from behind: the lid, a `</>` on it, the deck's front edge.
const laptop = layer('laptop', [
  group('M190 259 L181 268 L190 277 M210 259 L219 268 L210 277 M203.5 256 L196.5 280', {
    width: 2.6
  }),
  group(
    'M147 221 L253 221 C256 221 258 223 258 226 L262 312 C262 315 260 317 257 317 L143 317 C140 317 138 315 138 312 L142 226 C142 223 144 221 147 221 Z',
    { fill: PAPER }
  ),
  group('M121 317 L279 317 L285 327 C285 329 284 330 281 330 L119 330 C116 330 115 329 115 327 Z', {
    fill: PAPER
  })
]);

// A mug on the desk, and steam that drifts up off it.
const mug = layer('mug', [
  group('M330 302 C341 302 341 321 330 321'),
  group(
    'M300 295 L300 326 C300 328.5 301.5 330 304 330 L326 330 C328.5 330 330 328.5 330 326 L330 295 Z',
    { fill: PAPER }
  )
]);
const steam = layer(
  'steam',
  [group('M309 286 C304 278 314 272 309 264 M321 286 C316 278 326 272 321 264', { width: 2.4 })],
  {
    pivot: [315, 286],
    p: moving([
      [0, [315, 290, 0]],
      [120, [315, 276, 0]]
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
  return layer(`mark-${index}`, [group(mark, { width: 2.6 })], {
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
  glyph(MARKS[0], 0, [132, 214], [104, 150], 0),
  glyph(MARKS[1], 1, [268, 214], [298, 156], 26),
  glyph(MARKS[2], 2, [134, 214], [110, 162], 52),
  glyph(MARKS[3], 3, [266, 214], [292, 150], 72)
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
  // the head over the shirt.
  layers: [...marks, steam, mug, laptop, eyes, head, armLeft, armRight, body]
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(animation)}\n`);
console.log(`wrote ${OUT}`);
