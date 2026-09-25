"""
Traces the INSIDE of a closed shape in a line drawing — the paper a hand's
outline encloses — for scripts/typing-lottie.mjs, which uses it where a
moving piece has to be a solid thing rather than an outline: as its mask,
and as the paper that hides what it swings over.

    python3 scripts/portrait/region.py scripts/portrait/waving.png \\
      scripts/portrait/waving-regions.json \\
      hand:300,420:9:243,520,318,543 \\
      hand-keep:300,420:9:246.55,508.55,321.55,531.55 \\
      hand-fill:300,420:2:243,520,318,543

Each spec is `name:x,y:grow:cut`. The shape is flood-filled from the seed
`x,y` over everything lighter than the ink threshold trace.py uses (110 of
255), so the drawing's own lines are its walls; it is grown by `grow`
pixels (enough to take in the outline, or just to tuck under it), cut, and
traced. `cut` is a line `x1,y1,x2,y2` and the side the seed is on is kept
— or a single number, a horizontal line at that y. Numbers are in the
image's own pixels, like everything in the Lottie script.
"""
import json, sys
from collections import deque
import numpy as np, potrace
from PIL import Image

src, out, specs = sys.argv[1], sys.argv[2], sys.argv[3:]
im = Image.open(src).convert('RGBA')
bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
ink = np.asarray(bg.convert('L')).astype(float) < 110
H, W = ink.shape
yy, xx = np.mgrid[0:H, 0:W]


def flood(x, y):
    region = np.zeros_like(ink); region[y, x] = True; queue = deque([(x, y)])
    while queue:
        cx, cy = queue.popleft()
        for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
            if 0 <= nx < W and 0 <= ny < H and not region[ny, nx] and not ink[ny, nx]:
                region[ny, nx] = True; queue.append((nx, ny))
    return region


def grow(region, r):
    # A disc of radius r, as the union of shifted copies — no scipy needed.
    grown = region.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                grown |= np.roll(np.roll(region, dy, 0), dx, 1)
    return grown


regions = {}
for spec in specs:
    name, seed, r, cut = spec.split(':')
    x, y = (int(v) for v in seed.split(','))
    ends = [float(v) for v in cut.split(',')]
    x1, y1, x2, y2 = ends if len(ends) == 4 else (0, ends[0], 1, ends[0])
    side = lambda px, py: (x2 - x1) * (py - y1) - (y2 - y1) * (px - x1)
    keep = np.sign(side(xx, yy)) == np.sign(side(x, y))
    shape = grow(flood(x, y), int(r)) & keep
    # potracer traces what is FALSE, the way trace.py hands it `~ink`.
    curves = potrace.Bitmap(~shape).trace(turdsize=6, alphamax=1.0, opticurve=True, opttolerance=0.2)
    # The outer boundary is the curve that encloses the most area; a hole
    # would be a gap between fingers that growing did not close, which a
    # mask does not need.
    def area(curve):
        pts = [curve.start_point] + [s.end_point for s in curve.segments]
        return abs(sum(a.x * b.y - b.x * a.y for a, b in zip(pts, pts[1:] + pts[:1]))) / 2
    curve = max(curves, key=area)
    s = curve.start_point; d = f'M{s.x:.2f} {s.y:.2f}'
    for seg in curve.segments:
        if seg.is_corner:
            d += f' L{seg.c.x:.2f} {seg.c.y:.2f} L{seg.end_point.x:.2f} {seg.end_point.y:.2f}'
        else:
            d += f' C{seg.c1.x:.2f} {seg.c1.y:.2f} {seg.c2.x:.2f} {seg.c2.y:.2f} {seg.end_point.x:.2f} {seg.end_point.y:.2f}'
    regions[name] = d + ' Z'
    print(name, int(shape.sum()), 'px')
json.dump(regions, open(out, 'w'))
