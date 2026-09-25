"""
Traces the owner's line portrait into filled vector paths for
scripts/typing-lottie.mjs.

    pip install potracer pillow numpy
    python3 scripts/portrait/trace.py scripts/portrait/typing.png scripts/portrait/paths.json 661,768,52

Ink is anything darker than 110 of 255 — which keeps the drawing's lines
and drops every flat tone (skin, the laptop's grey, the steam), so the
result is in the site's two inks. The optional third argument is a list of
discs to leave out, `x,y,r;x,y,r` in the image's own pixels: for
`typing.png` that is the fruit on the lid, which is somebody else's mark.
Traced at 2x for smoother curves, written back at 1x.
"""
import json, sys
import numpy as np, potrace
from PIL import Image
src=sys.argv[1]
im=Image.open(src).convert('RGBA')
bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im)
g=np.asarray(bg.convert('L').resize((im.width*2,im.height*2),Image.LANCZOS)).astype(float)
ink=g<110
H,W=ink.shape
yy,xx=np.mgrid[0:H,0:W]
for disc in (sys.argv[3].split(';') if len(sys.argv)>3 and sys.argv[3] else []):
    x,y,r=(float(v) for v in disc.split(','))
    ink[(xx-2*x)**2+(yy-2*y)**2 < (2*r)**2]=False
bm=potrace.Bitmap(~ink)
path=bm.trace(turdsize=6, alphamax=1.0, opticurve=True, opttolerance=0.2)
out=[]
for curve in path:
    s=curve.start_point; d=f'M{s.x/2:.2f} {s.y/2:.2f}'
    for seg in curve.segments:
        if seg.is_corner:
            d+=f' L{seg.c.x/2:.2f} {seg.c.y/2:.2f} L{seg.end_point.x/2:.2f} {seg.end_point.y/2:.2f}'
        else:
            d+=f' C{seg.c1.x/2:.2f} {seg.c1.y/2:.2f} {seg.c2.x/2:.2f} {seg.c2.y/2:.2f} {seg.end_point.x/2:.2f} {seg.end_point.y/2:.2f}'
    out.append(d+' Z')
json.dump({'w':im.width,'h':im.height,'paths':out}, open(sys.argv[2],'w'))
print(len(out),'curves')
