@AGENTS.md

# Dev-Portfolio

A portfolio for a front-end engineer, on warm paper (`#efedea`) with true
ink type and **no accent colour at all**. Emphasis is carried by size,
weight and position; hover and focus by an underline. The only colour the
site will ever have is the project imagery.

Three kinds of page:

- **`/`** — the index. Masthead, work list, about, contact. The work list
  is the way in: one row is live at a time and its cover, summary and
  position sit beside it at eye level, and the preview wipes from one
  project to the next rather than cutting (trap 30).
- **`/works`** — all of it, on a ring. The covers hang on the rim of a
  circle whose centre is far below the page; the wheel, a drag or the
  arrow keys turn it, and a readout above rolls with it — number, name,
  one line and year, all placed from the same continuous position the
  covers are, so half a turn leaves the name half out of its mask. A `list` view beside it shows the same projects as a plain,
  ordinary-scrolling page. Reached from the corner marks as `all work`.
- **`/work/<slug>`** — one page per project. A sticky spec sheet on the
  left, a stack of shots down the middle, a rail of thumbnails on the
  right, and the next project at the foot. The shots are shown at their
  own proportions — full width, height auto — and so are the thumbnails
  beside them.

## Motion

Two of the three moments are a sheet of one colour moving in one direction
while something asynchronous resolves behind it. The third is the ring on
`/works`, and it is the only motion here that the reader steers directly.

**Arriving** (`Preloader`). A sheet of paper, and the name assembling
itself on it. Every letter waits just outside the line — odd ones above,
even ones below — and slides into place left to right, 70ms apart, out of
a mask cut to the ink.

Nothing flies anywhere afterwards. The line is built at the masthead's own
size, tracking and position, read off the real `<h1>`, so when the paper
dissolves the line underneath is already the one that was there — left,
top, run and size all matching to the pixel, at every width and under
`reduce`. There is no bar and no percentage: a second account of the load
would only be a weaker one than the letters already give.

It runs on **every document load, reloads included**. There was a
`sessionStorage` flag that showed it once per session; the owner asked for
it on every reload and it is gone. The division that matters is not
first-visit versus repeat, it is document load versus route change: this is
a module evaluated once per document, so an in-app navigation never
re-runs it, and the two curtains can never be on screen together.
Reloading `/work/<slug>` still gets the curtain, but the letters have no
masthead to land on there, so they solve against the column and simply
clear (see trap 10).

The cost is honest: the hold is 1.2s and the whole gesture about 1.8s, on
every refresh. `MIN_HOLD_MS` in `Preloader/index.tsx` is the knob.

**Turning the ring** (`/works`). The third motion source, and the only one
that is not a curtain. It answers the reader's own wheel or drag, eases
toward a target and settles on a whole project; it wraps, so the last leads
back to the first. The curve is eight CSS transforms — a point on a circle
and the tangent at that point. There is no canvas, and there is no easing
at all under `reduce` (see the a11y invariants).

**Switching views** is the same covers doing something else. They do not
disappear and reappear: one number, `blend`, runs 0 to 1 and every cover is
placed by interpolating its pose on the ring against its pose in the deck,
so the ring visibly gathers into the list's preview and fans back out of it.
The list's rows rise out of their own masks 42ms apart, starting *inside*
the gather rather than after it — waiting for the covers to land first reads
as two things in turn, overlapping reads as one. All of it lives in
`Library/timing.ts`.

The shape came from the page the owner asked for, measured rather than
copied by eye: its rows began rising 557ms after the click, 39ms apart, each
taking 587ms, while its covers were still gathering. Ours is that,
tightened, because it has eight rows to fill and the reference had twenty.

The ring costs the reader the wheel for as long as they are on that page,
which is the one thing a scroll-driven carousel can never give back. The
`list` view is the answer to that, and it is worth being exact about what it
does and does not give: all eight names at once, a keyboard path that does
not go through the ring, and a plain scroll region the wheel drives natively
rather than a hijacked one. What it no longer gives is document scrolling:
both views are one screen tall, which is what lets them share a stage and
animate into each other.

**The list is sized to fit, and only then is its scrollbar taken away.**
Those are one decision, in that order. The row rhythm was set by eye at
1440x900, where it fit — and overflowed at every laptop anyone actually
owns: 1440x800 by 50px, 1366x768 by 58, 1280x800 by 21, 1024x768 by 24.
Hiding the bar first would have meant a MacBook Air silently cutting off the
last project. Tightening the row to about 39px instead puts the overflow at
zero from 375x700 all the way up, and the bar is then hidden because there
is nothing left for it to report. The one size still short is 320x568, by
37px, where the half-cut row is the affordance; the region is still a real
one there, verified — the wheel moves it 36px and tabbing to the eighth row
scrolls it into view.

**Arriving, after whichever curtain brought you.** Type rises out of its
own mask once the page has been handed back — by the preloader on a cold
load, by the ink panel on a route change (trap 28).

What rises is not the same on the two paths, and the difference is one
thing: **the preloader hands the masthead over and the route curtain does
not.** The entry curtain assembles its own copy of the name at the
masthead's own size and position and puts it there, exact to the pixel, so
on that path there is nothing left to reveal and a mask would be a second
opinion about where the name belongs. A route change introduces nothing —
the heading simply appears — so there it comes up out of a mask like
everything else. `useViaRoute` is what tells them apart, and on the load
path the mask is not in the document at all (trap 29).

On a project page the name is masked on **both** paths, because there is no
handover to protect: reloading `/work/<slug>` still gets the curtain, but
its letters have no masthead to land on, so they solve against the column
and clear. The spec sheet comes up a row at a time behind the name, and the
first shot washes in. Before that, a project was the one place on this site
where the curtain opened onto a still picture.

The work list's names rise out of their own masks as the list is reached,
38ms apart. That is not decoration: the corner marks off the index point at
`/#work`, `/#about` and `/#contact`, not at `/`, so arriving from a project
page drops the reader **past** the masthead and its line — measured at
scrollY 1078, with every revealing block above the viewport and nothing at
all animating in view. The list was the one thing on screen and the one
thing with no reveal on it.

Further down the index, `About`'s paragraph, the address and the colophon
rise as they are reached. All of this is a reversal of something recorded
below as rejected, and the difference is the point: what was thrown out was
the same fade-and-slide-up on all seven sections. What is here is a mask per
*measured* line, on chosen pieces of type, in the idiom the site already
speaks — the preloader's letters, the readout on `/works`, that page's list.
`Lines` measures where a paragraph actually breaks, `Headline` masks display
type, and `useReveal` decides when. The single element that fades rather
than rises is the first shot, which has no lines to mask.

The shape was measured off the page the owner asked for rather than copied
by eye: its masked lines sit in a box the height of the line itself and
travel exactly that far, its stagger is about 50ms, and it masks its
**headline** type — which is the part this site was missing. Ours had one
20px paragraph moving 32px on a screen whose largest object was frozen.

**Moving between pages** (`PageTransition`). An ink panel rises to cover
the page, the next route is fetched and committed behind it, the scroll is
put back to the top, and the panel carries on upward to uncover. One
direction throughout — it never comes back down the way it came. The
destination's name sits on the panel in paper while you wait, which is the
same foot-left position the preloader puts its name in.

The inversion is not a new colour. `::selection` has always drawn this
site's type paper-on-ink, so the curtain is the page's own palette turned
over for a second rather than a second palette.

**The destination is empty while the panel is shut.** `data-routing` carries
a phase now — `covering`, `holding`, `leaving` — and `#content` is blanked
for `holding` only. During `covering` the reader is still looking at the
page they are leaving, and taking it away underneath them is the jump this
whole thing exists to remove. The gate comes off the moment the uncover
starts, so the strip the panel clears shows the destination in its PARKED
state — masks empty, display type below its clip, the ring turned away —
and the reveals still wait for the end of the uncover. Panel shut onto a
blank page, panel sweeps off a parked one, type arrives. See trap 34.

**The route is only pushed once the panel is closed.** Push during the rise
and React commits the new page while the top of the screen still shows the
old one — a visible jump, which is the whole thing this exists to remove.
`router.prefetch` at click time is what keeps that ordering cheap.

Durations live in `global.css` as `--t-quick`, `--t-cover`, `--t-reveal`
and `--t-handoff`. Only the first is used by CSS; the other three are read
off the computed style by the two components, because a CSS animation
cannot wait for a webfont or a route. Do not invent a fifth at a call site.

**Changing the live project** (the index's work list). Every project's
preview is mounted at once and stacked in one grid cell, and the live one
wipes over the top: the layer travels a frame-height while its own contents
travel the same distance the other way inside it, so the picture never moves
and only the edge does.

**It is scrubbed, not played.** The edge sits wherever the reader's own
position between two rows puts it — scroll down and the next project rises
into the frame, stop half way and it stays half way, scroll back up and it
lowers out again. There is no duration and no direction to detect: one
expression of one number covers both ways, which is also why it can never
be caught stuck part-way when the reader changes their mind. It is the same
continuous reading the ring's readout and the thumbnail rail are placed
from, and the same reason none of the three has a transition on it.

The pointer and the keyboard are the exception, because they are not a
position — pointing at a row eases the edge to it, and leaving the list
eases it back to wherever the scroll had got to.

## Things that have been rejected here

Three directions were built and thrown out. Do not walk back into them.

**WebGL, twice.** First a full-bleed `Stage.tsx` backdrop (a fixed canvas
behind every line of body copy — a permanent contrast liability), then a
`DeskScene.tsx` seated figure in the hero. three.js is not a dependency.

**The broadsheet look, once.** Swiss-editorial on a tinted near-black
(`#0d1117`) with one bright cyan accent, hairline rules everywhere,
tracked-out ALL-CAPS eyebrows over every section, monospace for every small
label, `→` after links. That is close to a complete checklist of the
anti-patterns in the `frontend-design` skill, which is why the owner kept
reading it as unchanged. Still banned:

- no rules or hairline dividers anywhere
- no ALL-CAPS labels, no letter-spaced micro-type — labels are lowercase
- no `·`-joined meta strings, no `→` appended to link text
- no cards, no border radius, no drop shadows
- no monospace
- no per-item ordinals unless the content really is a sequence

**A crossfade route transition, once.** The View Transitions API, with the
project's name as a shared element morphing from the work list into the
project page's `<h1>`. It looked good in a frozen frame and felt broken in
motion, and the reason is worth keeping: **it snapshot the outgoing page at
the reader's scroll offset and the incoming one at zero, then cross-faded
between the two.** No easing reconciles two pictures of different places —
the page visibly jumps. It was not dropped frames; measured at a 13.4ms
median with no long tasks. Covering the swap is the only way to move the
scroll without anyone seeing it. Everything that build added — `<ViewTransition>`,
`view-transition-name`, `::view-transition-*` rules — is gone.

**The measure, once.** The curtain drew a dimension line opening from the
left margin to the right one, with a tick at each end, and two live
readouts — `available`, the width being solved for, and `fit`, the size it
produced — while the name grew to fill it. The idea was that the one piece
of machinery this site really runs is `useFittedText`, so the load moment
should be that measurement happening. It measured perfectly and it looked
like a CAD screenshot: a technical drawing is a cold thing to open a
portfolio with, and the numbers explained the mechanism to someone who had
not asked. Landing the name exactly on the masthead was the part worth
keeping, and the letters kept it.

**Live "studies", once.** A section of running interface demos — an easing
editor, an OKLCH contrast meter, a container-query resizer — stood in for
project imagery while there was none. The owner found them meaningless, and
they were: clever about the medium, silent about the work. The lesson is
narrower than "no interaction" — **a portfolio has to show the work, and
for this one that means pictures of it.** The fitting engine survives
because it does a job (see trap 8); nothing else from that build does.

## Commands

```bash
yarn dev          # dev server
yarn build        # production build — run before claiming anything works
yarn lint:fix     # biome check --write
npx tsc --noEmit  # typecheck (strict)
```

Biome, not ESLint/Prettier. 2-space, single quotes, semicolons, width 100.

## Where things live

```
app/(frontend)/(withoutFooter)/page.tsx          the index
app/(frontend)/(withoutFooter)/work/[slug]/      one page per project
src/content/site.ts        ALL site content. Plain data, no imports.
src/modules/Studio/
  index.tsx        composes the four bands of the index
  Open.tsx         the masthead
  Work.tsx | About.tsx | Contact.tsx
  Corners.tsx      the fixed chrome at the four edges
src/modules/Library/
  index.tsx        /works — the ring, its geometry, and the view switch
  Readout.tsx      the rolling number / name / year above it
  Roll.tsx         the same projects as a plain list
src/modules/Project/
  index.tsx        the three-column project view
  SpecSheet.tsx | ShotStack.tsx | NextProject.tsx
src/components/Shot.tsx    one image, or the field it will go in
src/utils/imageSize.ts     a file's real dimensions. SERVER ONLY.
src/components/Lines.tsx   prose split into its own measured lines, masked
src/components/Reveal.tsx  the same mask for what is already one line
src/components/Headline.tsx  the mask for display type, inside the heading
src/hooks/useReveal.ts     when a masked block is allowed to come up
src/components/Preloader/  entry curtain + pre-paint boot script (boot.ts)
src/components/PageTransition/  the route curtain, and the only place
                           internal navigation is handled
src/hooks/useFittedText.ts the fitting engine
src/hooks/useCarousel.ts   the ring's position engine
src/styles/global.css      design tokens + .st-* primitives
public/fonts/              Nippo + Switzer, self-hosted
public/images/work/        project imagery goes here
```

Path aliases: `@Components @Modules @Layout @Hooks @Constants @Utils @Styles @/*`.

There is no header band and no footer band. `Corners.tsx` holds all the
chrome at the four edges of the viewport.

## Type

**Nippo** (display) and **Switzer** (text), both from Fontshare, both
self-hosted via `next/font/local`. Nippo has only 400/500/700.

Nippo was chosen by rendering four candidates at the sizes this site
actually uses. That step is not optional — **Array** was the first pick and
had to be thrown out on sight: it is a halftone-dot face that turns to
unreadable noise below about 40px. Cabinet Grotesk and Excon were both too
close to a default geometric sans. Render before you commit.

## Content

**All copy, projects and links live in `src/content/site.ts`.** Nothing else
hardcodes content; `src/constants/common.ts` and `app/sitemap.ts` both read
it. Current values are placeholders marked `TODO`.

Imagery goes in `public/images/work/`. A `null` `src` is not a broken
state: `Shot` renders a sized, labelled field, so the layout, the scroll
length and the thumbnail rail are all correct before a single screenshot
exists. Set `cover` for the index preview and fill `shots` for the project
page.

Three standing rules:

- **Never invent biographical facts** — name, location, employers, clients.
- **Never invent awards, metrics or credentials.** The source design shipped
  fake Awwwards/CSSDA/FWA claims and a "Numbers" column of em-dash
  placeholders. There is deliberately no `recognition` field on `Project`,
  which is exactly where the reference design puts its award list.
- **Every `Shot` needs a real `alt`** describing what the image shows, not
  "screenshot of the homepage". It is the only description a screen reader
  gets.

## Traps

These are not style preferences. Each one was a real bug here.

**1. `.st-*` primitives must stay inside `@layer components`.**
Tailwind v4 puts utilities in `@layer utilities`, and unlayered rules beat
layered ones regardless of specificity. Outside a layer, `.st-display`
would silently defeat any `leading-*` or `tracking-*` set beside it. Keep
`html`, `body`, `::selection`, `:focus-visible` and the reduced-motion
block unlayered; they rely on it.

**2. The root font-size is fluid, and it redefines every rem.**
`html { font-size: clamp(0.9375rem, 0.5vw + 0.525rem, 1.3125rem) }`.
Tailwind's whole spacing scale resolves against it, so `p-4` is not 16px.
Keep it in `rem`, never `px` — a px root overrides the reader's own
font-size preference (WCAG 1.4.4).

**3. Lenis owns scrolling — with two consequences.**
`window.scrollTo` is a no-op; use `window.lenis.scrollTo`. Never add
`scroll-behavior: smooth`. But:

- Lenis scrolls the real document, so a plain
  `window.addEventListener('scroll', …)` **does** fire — measured at 28
  events across one 400ms programmatic scroll. `Work` and `ShotStack` rely
  on that rather than taking a dependency on Lenis's own emitter.
- Lenis does **not** honour `scroll-padding-top`; that property only
  applies to the browser's own scroll-into-view. Every `lenis.scrollTo`
  that targets an element must pass `offset: -scrollPaddingTop`, read from
  the computed style so the two cannot drift. Without it the fixed corner
  marks land on top of whatever you scrolled to.

**4. In-page links must go through `useAnchorNav`, and only on the index.**
`preventDefault()` cancels the whole navigate-to-fragment step — not just
the jump, but the hash update *and* the focus move. The hook restores both.
`Corners` switches to real `/#work` links off the index, because there the
target elements do not exist and the hook would silently do nothing.

**5. Client boundaries are leaves, not wrappers.**
There is no page-wide client boundary. The old `Shell.tsx` existed only to
run a GSAP scroll-reveal over every block; the reveals were identical at
all seven call sites, which is the universal fade-up tell. The client
leaves are `Open`, `Work`, `Corners` and `ShotStack` — each owns real
state. Do not add `'use client'` to either module's `index.tsx`.

**6. `src/content/site.ts` is on the server metadata path.**
`src/constants/common.ts` imports it. It must stay plain data with no
imports — a single `import` of anything browser-only breaks `next build`.

**7. Palette values do not survive a change of ground — re-derive, don't nudge.**
The ground has moved three times (`#0a0a0a` → `#ececec` → `#0d1117` →
`#efedea`). Dimming pulls text *toward* the ground, so the dim used for the
unfocused rows of the work list inverts with it: it was 0.42 opacity on
dark, and on this paper it is a solid `--ink-3` of `#7d756d`, only 3.88:1.

Same reasoning gave `--well` (`#d9d5cf`, the empty-image field) its value.
It is *darker* than paper so it reads as a blocked-out area rather than a
wash, which is also what lets its label be `--ink` at 12.87:1 instead of
`--ink-2` at a marginal 4.03:1.

**8. `useFittedText` measures; it never computes from a coefficient.**
It sizes the masthead and each project's title to fill their column
exactly. Three things make that harder than it looks:

- **A per-character coefficient does not exist.** At display tracking,
  `IIII` is about 0.35em per character and `MMMM` about 0.85em — a 2.4x
  spread. Any `chars x ratio` formula is wrong for most strings.
- **Measure the container's content box, never the element's own.** The
  fitted element is `white-space: nowrap`, so when the text is wider than
  the column its box grows to the text and the next fit reads its own
  previous output. That fed back as 131px, then 185px, then 242px from
  identical input.
- **Measure on a detached probe,** and re-express `letter-spacing` as an em
  ratio first — its computed value is px against the element's *current*
  size, so carrying it onto a 100px probe applies the wrong tracking.

Also: the ResizeObserver reacts to **width only**. Its observed box's
height changes as a direct result of the font-size the callback writes, so
reacting to height is a loop that never settles. And never skip the final
write as "unchanged" — the whole masthead once rendered at exactly the
probe size because a guard returned early.

**9. Hydration.** The corner clock renders `--:--` on the server and starts
in an effect. Keep any time-, random- or `window`-dependent value out of
render.

**10. The preloader owns `data-preloading`, and owns it defensively.**
A blocking `<head>` script sets the attribute before first paint;
`global.css` keys three things off it — the curtain's display,
`animation-play-state: paused` on everything, and the scroll lock.

- The pause rule is **deliberately unlayered**, which is how it beats
  Tailwind's `animate-[...]` utilities (the `animation` shorthand resets
  play-state) without `!important`. Do not move it into a layer.
- The component must never treat the attribute as its input. StrictMode
  runs effects twice and pass one's cleanup releases it — read it once at
  module scope (`shouldRun`) and **re-assert** it in the effect.

`<html>` carries `suppressHydrationWarning` because of that pre-paint
mutation. The curtain drives itself with GSAP, not CSS animation, so its
own guard cannot freeze it.

Four more things about the assembling line specifically:

- **Read `--fit-size`, never the computed `font-size` — and not on its own
  either.** They are only the same once `useFittedText` has run: `.st-fit`
  falls back to a clamp until then, and the clamp is nowhere near the
  solved value, measured at 160px against a real 257px. But the property
  being *present* only means a value has been written, not the last one —
  it is set on the way through the search too. Two consecutive frames
  agreeing on both the size and the run is the test that it has stopped
  moving; one read caught it mid-solve and dressed the line to a run the
  masthead had already left.
- **Size settling is not position settling.** `--fit-size` says the line is
  solved; it says nothing about where it sits, which depends on the
  section's centring and therefore on the intro paragraph below it
  reflowing when the text face arrives. Read the box once and the curtain
  lands 44px off. The stage re-reads the heading every frame instead — one
  rect, and the coincidence becomes true by construction rather than by
  timing.
- **Splitting a string into one box per character loses its kerning, and
  you cannot put that back as tracking.** CSS adds letter-spacing after
  every character, inside whichever box that character is in, so the total
  advance survives the split; the kerning pairs do not, because there are
  no longer two adjacent characters for them to apply to. Correcting it by
  spreading the difference over the line is wrong in a way that a
  measurement of the total run cannot see: **both ends land and the middle
  does not** — measured at 0 for the first letter, 1.2px for the last and
  6.6px for the `o` in between, which is what the owner saw. So nothing is
  spread and nothing is divided by a character count. A hidden `ref` holds
  the same string unsplit at the same size, which is the masthead's layout
  by construction, and a range over each of its characters says where that
  character goes; the letters are placed there absolutely. Every letter
  then matches to the last bit of a double — `dx` is exactly 0, not
  rounded to 0.
- **Hand the letters back to normal rendering before the dissolve.** A
  transform, including the identity one a finished tween leaves behind, and
  a `will-change` hint each put an element on its own raster path, where
  the same glyph at the same position antialiases differently. Clearing
  both takes the handover from "a thin outline around every letter" to
  pixel-identical at 320 and 768, and to 25 device pixels out of 1.5M at
  1440 on a 2x screen — one glyph edge, a sub-pixel rasterisation
  difference with the layout positions bit-identical.
- **`columnWidth` is a knowably wrong estimate.** It is taken while the
  curtain holds `overflow: hidden` on `<html>`, so there is no scrollbar
  and the viewport reads one scrollbar too wide for the page that is about
  to exist. Measure the difference with a probe rather than assume it: zero
  on overlay scrollbars, ~15px on classic ones. It only carries the reload
  of a project page, where there is no masthead to read.
- **The mask is measured, not an em guess.** `.st-display` sets
  `line-height: 0.9`, tighter than the face's ascent plus descent, so the
  glyphs hang out of their own box and a mask cut to the box shaves the
  caps and the descenders. `measureText` gives the real overhang for the
  real string: 2px for a name with no descenders, 33px once there are
  descenders or Vietnamese diacritics. A guessed 0.22em was 56px, which
  left the letters floating in full view instead of arriving out of an
  edge.
- **Nothing reveals the masthead any more**, so there is no masthead
  animation left for `data-preloading` to hold. `st-fade` on the corner
  marks is the only held animation, and it is why `release()` still happens
  mid-dissolve rather than at the end: the frame comes up around the name
  while the paper is still going. `st-rise` is gone, and so is the version
  after it that kept the name small in the corner and flew the real `<h1>`
  up into place — assembling a copy in position says the same thing without
  the journey, and without one component transforming another's element.

**11. `--chrome-top` is derived; do not replace it with a number.**
The fixed corner marks own the top of the viewport, and their height is
`var(--gut) + 2.3rem + 2.5rem` — the gutter, two lines of `.st-meta`, the
gradient. Every sticky offset and `scroll-padding-top` is expressed against
it. A hand-tuned `7rem` was 12px short at desktop and clipped the project
page's spec sheet under the band; the gutter is fluid, so any fixed value
is wrong at some width.

**12. Do not put an ARIA role on a shape or a div — use the element.**
Biome's `useSemanticElements` has been right every time it has fired here.

**13. Next's dynamic `params` is a Promise.** `app/work/[slug]/page.tsx`
takes `params: Promise<{ slug: string }>` and awaits it, in both the page
and `generateMetadata`. Read `node_modules/next/dist/docs/` before writing
route code; this version differs from older App Router conventions.

**14. Internal links are intercepted in the CAPTURE phase.**
`next/link` calls `preventDefault()` on every internal href so it can route
on the client, and React's listener sits on the root container *inside*
`document`. A bubble-phase listener on `document` therefore finds
`defaultPrevented` already true on exactly the links it exists to catch,
and silently never fires — measured: the curtain stayed hidden and the
route changed in 73ms. `PageTransition` listens with `capture: true`, and
calls `stopPropagation()` so next/link does not navigate a second time
underneath the panel.

Running first costs it the one thing bubbling gave for free: it no longer
knows what `useAnchorNav` decided. The `url.pathname === location.pathname`
test is what keeps the curtain off the index's own `#work` / `#about` /
`#contact` links now. On that path the event is left completely alone — no
`preventDefault`, no `stopPropagation` — so the hook still gets it intact.

**15. GSAP's `yPercent` composes with the transform it finds.**
It does not replace it. The curtain also carried Tailwind's
`translate-y-full` for a while, and the two stacked to 200%: "covered" left
the panel a full viewport *below* the screen and the route changed behind a
curtain nobody ever saw. Measured at 1800px on a 900px viewport. One owner
per transform — here that is GSAP, and the parked position is a `gsap.set`
on mount, not a class.

**16. A full-bleed fixed panel cannot cover the scrollbar. Stop trying.**
On a platform with classic scrollbars the route curtain stops short of the
right edge and a pale strip shows. That strip is the scrollbar, which is
browser chrome and paints above every element. `w-screen` does not reach
it: `scrollbar-gutter: stable` on `<html>` takes the gutter out of the
viewport-percentage units as well, so `100vw` measured 1425px on a 1440px
window — identical to `inset-0`. It is invisible on macOS, where scrollbars
overlay. Leave it alone.

**17. Check the built CSS, not the source.**
Lightning CSS, which Tailwind v4 runs the stylesheet through, rewrites more
than whitespace: it minified `blur(0)` to `blur()`, which is not valid, so
the browser dropped the declaration and the source looked right for an
hour. `curl` the chunk out of `/_next/static/chunks/` and read it when a
rule appears not to apply.

**18. `Range.getBoundingClientRect()` does not flush layout.**
`Element.getBoundingClientRect()` does; the Range version returns whatever
the last layout said. Every measurement here is taken in the same turn as
a style write, so every one of them came back a frame stale. A correction
solved against a stale run and then checked against another one oscillated
for 400ms and settled 70px short, and the same staleness reads a heading
mid-webfont-swap as still being in the fallback face — which looks exactly
like `document.fonts.ready` having resolved too early. Touch
`el.getBoundingClientRect()` first, then take the range.

(`document.fonts.ready` resolving early is a real hazard too, just not that
one: it answers "nothing is pending", which includes the window before the
first layout that needs the face has asked for it. `document.fonts.check`
with the family name is the question that was meant.)

**19. Under `reduce`, every property on every element is transitioned.**
The reduced-motion block sets `transition-duration`, and
`transition-property` defaults to `all` — so it does not shorten existing
transitions, it creates one for everything. A transitioned property does
not take its new value synchronously, which turns any write-then-measure
into a read of the value *before* the write. That is what made the fit
solve against its own previous output under `reduce` alone, 61 passes of a
damped oscillation, while ordinary motion was exact on the first try.

`Preloader` opts its own elements out with inline
`transition: none !important` — inline important, because an `!important`
is what created the transition. The letters are in that list as well as the
line: `letter-spacing` is inherited, so each span transitions its own copy
and its box is a frame behind even when the line's is not. Exempting the
line alone took the error from 70px to 3px and no further. Nothing in
either curtain is CSS-animated in the first place, so this costs the
promise nothing.

**20. A drag that ends on a link cannot be un-clicked afterwards.**
`PageTransition` listens for clicks on `document` in the capture phase
(trap 14), which means it sees the click before any listener the ring could
register — there is no `preventDefault` late enough to stop it, and
`stopPropagation` from inside the ring is later still. Dragging the ring
therefore navigated to whichever project happened to be under the pointer
when the finger came up.

The fix is upstream of the event: once the pointer has moved past the slop
threshold, `pointer-events: none` goes on the `<ol>` holding the covers, so
the click's hit test lands on the surface and `closest('a')` finds nothing.
next/link never sees it either. It is restored **two frames** after
`pointerup` — the click is dispatched before the next frame, so one frame is
not enough and anything longer starts eating real clicks.

The drag listeners are on `window`, not the surface, for the same reason:
the gesture has to keep running while its own anchors are out of the hit
test.

**21. The readout is placed, not transitioned.**
It used to park each line on the nearest whole project and CSS-transition
between the two poses. That is always a step behind: the text could not
start moving until the ring had already arrived, which is exactly what the
owner saw. Now every line is written each frame from the ring's own
continuous position — `shortest(index - position) * 110%` — so the two
cannot disagree.

A transition on `.st-roll-line` would now be a second opinion about where
each line belongs, always a few frames behind the first, so there is
deliberately none. Verified by comparing the *computed* transform against
the inline one that was written: worst disagreement **0.01px** across 137
frames of a turn. If someone puts a transition back, that number is how it
shows up.

`Readout` therefore takes no props and is wrapped in `memo` — it renders
the pose at position 0 once, for the server and the first paint, and never
again. Its lines are collected from the DOM once and written to directly.
That costs 32 style writes a frame on top of the covers' and changes
nothing: 13.4ms median, zero frames over 20ms.

**22. `scale()` shrinks about the centre, so a corner landing is off by
half of what the element gave up.**
The covers gather onto an empty slot in the list, and the slot is measured
rather than positioned by a second set of numbers. Translating a cover to
the slot's top and then scaling it down left it **34.6px** low with a 434px
cover landing in a 311px slot — exactly `h(1 - scale) / 2`. The x needed no
such correction, because it is centred and the centre is the one thing
scaling holds still. With the term in, the landed cover matches the slot at
`dx` `dy` `dw` `dh` all 0, at every width.

**23. Measuring where text breaks must not change where text breaks.**
`Lines` splits a paragraph into its own lines. The first version wrapped
every word in a span and read the spans, and it never settled: these
paragraphs sit where the element's width follows its content — a flex item
in `About`, an `ml-auto` block in `Open` — so splitting changed the width,
the observer watching for a width change fired, the split was thrown away,
and the block oscillated. That is trap 8 in a new costume, and it has the
same two answers. **Measure without writing**: a `Range` over the element's
own text node, one word at a time, reading which line box each landed in —
no DOM change, so no layout change (and touch `el.getBoundingClientRect()`
first, per trap 18). **And observe the parent**, whose width does not
depend on this element's pose.

Three more things it cost, each a real bug:

- **A value cannot be its own request.** Invalidating by setting `lines`
  back to `null` loses the request whenever the reset lands in the same
  batch as the split before it: React collapses rows-then-null to no
  change, the effect's dependencies never move, and the block sits plain
  for good. Measured exactly that way — the split ran once per paragraph
  and the three resets that followed re-ran nothing. A separate `pass`
  counter is what asks for a re-split; `lines` only ever answers.
- **`data-preloading` must not be read synchronously at mount.** Trap 10
  says the preloader re-asserts the attribute because StrictMode's first
  cleanup removes it. A consumer reading it in its own mount effect can
  land in that gap and conclude the page was let go before the curtain had
  drawn — measured: the intro arrived at 33ms with the curtain still up.
  `useReleased` defers its first read by a frame, by which time both writes
  have happened, and keeps a MutationObserver for the real release.
- **A block per line eats the space the break stood for.** Concatenated
  back, the paragraph read "I build it tohold up." Each line but the last
  carries a trailing space, which a block collapses away visually and a
  screen reader does not.

**24. An IntersectionObserver reports a change, not a state.**
A block can go from below the fold to above it without ever intersecting —
a hash link, a restored scroll position, any programmatic jump. Measured at
375: one jump to the foot of the index and the about paragraph stayed
hidden for good. Text that never appears is a worse failure than a reveal
that fires early, so `useReveal` asks a plain question on scroll instead —
is this block at or above the trigger line — which is true for everything
already passed. Lenis scrolls the real document, so the listener fires
(trap 3).

**25. An indicator quantised to N places cannot track a continuous scroll.**
The project page's thumbnail rail outlined whichever shot was nearest the
middle of the screen, which meant the outline had only as many positions as
there were shots: on a two-shot project it took exactly **two**, and moved
in a single **29.5px** jump, while the reader's own position moved at most
0.08 of a shot per frame. Nothing was dropping frames — the sticky rail
measured a spread of **0** across 75 frames of scrolling, and the median
frame was 13.3ms. The stutter was the indicator, not the scroll.

It is now one marker, written per frame from the same kind of continuous
position the ring uses: where the middle of the screen falls between two
shot centres, interpolated onto the thumbnails' own boxes. 21 positions on
that same two-shot page, worst step 2.3px; 45 and 4.16px on a three-shot one
whose middle shot is a different crop, which is why the marker's height is
interpolated too.

**And the thumbnails touch, because of what a frame means.** They used to
sit 0.4rem apart, and a marker that can stand between two of them then
spends half its time framing a strip of bare paper — measured: at the
midpoint it sat at 230.8 with thumbnails at 216 and 245.5, correct to the
pixel and still reading as broken, because a frame claims to be *around
something*. With the gap closed the rail is one strip and the marker is a
window onto it: on a shot it is exactly around that thumbnail (`dTop` 0,
`dH` -0.01), between two it is exactly around the part of each you are
between, and it is never outside the strip. The outline is drawn with a
negative offset so it sits inside its own box rather than bleeding two
pixels onto the neighbours it is not pointing at.

Three things this cost, all worth knowing:

- **Use rects, not `offsetTop` / `offsetHeight`.** Those round to whole
  pixels, and a thumbnail here is 23.4px tall — the marker parked 0.48px
  high and 0.28px short of the thumbnail it was meant to be sitting on.
- **`aria-current` and the marker must round the same number.** Deciding
  "nearest centre" separately from "where the marker goes" is two answers
  to one question, and they disagree at the crossover.
- **A continuous readout and a discrete state need different shapes.** The
  strip is what makes one outline able to do both jobs here. Reach for a
  second element before reaching for a frame that can point at nothing.

Under `reduce` the marker stands on whole shots — verified at two distinct
positions across the scroll, where ordinary motion gives 21.

**26. Four things on the ring are measured, not chosen.**

- **The mask's line-height is `normal`.** `.st-roll` clips, and `.st-display`
  sets `line-height: 0.9`, which is tighter than Nippo's ascent plus
  descent — the same overhang the preloader had to measure (trap 10). Here
  there is no need to measure it: `normal` *is* the face's own box, 1.269em
  for Nippo, so no glyph can reach past the clip and no number in this repo
  has to be kept in step with the font. A call site that wants a looser
  line still wins, because utilities are layered after components.
- **The cover width is solved, not a fraction of anything.** A fraction
  tuned at 1440 gave a phone a row of stamps; one tuned at 375 gave a
  desktop three covers the size of posters. Four rules answer instead, in
  the order they matter: the stage height, so nothing runs off the bottom;
  a **whole** neighbour clear of the middle cover, which is the thing the
  ring actually reads as; `COVER_READABLE`, because a screenshot below
  about 200px shows nothing; and `PEEK` last with the final say, because a
  ring with no visible neighbour is not a ring. Which one binds changes
  with the screen — the height on a short desktop window, the whole
  neighbour on a tall one, `PEEK` on a phone — and that is the point.
  How deep the ring is drawn is climbed on top of that: the room to reserve
  below it depends on how many covers are on screen, which depends on the
  width being solved for, so the solver starts one step deep and goes
  deeper only while the next cover out would still be on screen at the
  answer that produced.
- **A cover is 16:9, and the shape is one number.** `TALL` is a cover's
  height per unit width, and everything above resolves through it, so
  changing the shape is changing `TALL` and the `ratio` on the `Shot` —
  nothing else. The covers were 4:5 first, and the change to 16:9 is what
  turned up the bug in the bullet below.
- **A turned box is bigger than the box it came from.** `w x h` rotated by
  `a` occupies `h·cos a + w·sin a` tall and `w·cos a + h·sin a` wide, and
  the ring turns every cover off the middle. Reserving room for the
  *unrotated* box was a rounding error while the covers were portrait and
  became a real one the moment they were landscape — a wide box gives up
  far more to a turn than a tall one does. Measured as exactly the **14px**
  the outer covers were clipped by at 1440 straight after the change to
  16:9. The reservation is a maximum over the whole steps the covers sit
  on, not the value at the furthest one, because with the turn folded in
  the deepest cover is not always the furthest out.
- **A cover off the side of the screen stays focusable.** It is faded and
  has `pointer-events: none`, never `visibility: hidden` — hidden would
  take it out of the tab order and make five of the eight projects
  unreachable by keyboard. Focus on one calls `goTo`, so tabbing turns the
  ring to whatever the keyboard has reached. Verified: tabbing to the sixth
  cover leaves it fully on screen with the readout on `06`.

**27. A shot is shown at its own shape, and the shape is read on the
server.**
Every shot used to be cropped to a declared `16 / 10` with `object-cover`.
The real files are nothing like it — the two on `/work/soluis` are 1.749
and 1.743 — so `cover` matched their height and threw away **8.5% of the
width**, 4.3% off each side. On a screenshot that is not a neutral crop:
the edges are where the layout being shown off actually is, and both of
those images lost part of a right-hand column. Measured before: both
932.3x582.7, ratio 1.6000. After: 932.3x533.3 and 932.3x534.5, at 1.7483
and 1.7442 — the files' own shapes, at every width from 320 up.

Three things that decides, and one it does not:

- **The ratio has to be known before the image arrives, so it is measured
  on the server.** `ShotStack` places the rail's marker from where each
  shot's centre falls (trap 25), so a column that grew as each file landed
  would move every one of those centres under the reader. `width`/`height`
  on the `<img>` are the intrinsic pixels — not a rendered size, but the
  reservation — and `sizeOf` reads them off the file with `sharp`, which is
  already a dependency and is in Next's own `serverExternalPackages`, so it
  is required rather than bundled. The project pages are `dynamicParams =
  false`, which makes this a build-time read of four files. Verified by
  holding `/_next/image` for 2.5s: the boxes stood at 533.02 and 534.91
  before a byte arrived and at 533.28 and 534.52 after — **0.26px and
  -0.39px**, one pixel of document height across the whole page. That
  residue is the optimizer rounding a resize to whole pixels, and
  `object-fit: fill` absorbs it.
- **Not in `src/content/site.ts`.** That file's promise is "drop a file in,
  set `src`, and nothing else has to change", and a hand-typed height goes
  stale the first time an image is re-exported. A static `import` would
  carry the dimensions for free and is exactly what trap 6 forbids there.
- **`tall` now shapes the EMPTY field and nothing else.** There is nothing
  to measure on a field with no image in it, so it still needs a declared
  ratio, and `tall` still breaks the rhythm of a stack of them. Verified on
  a project with one of each: thumbnail ratios 1.738, 1.683 (measured) and
  1.600 (declared) in one rail.
- **A slot keeps its crop, and that is not an inconsistency.** The index's
  preview aside and the ring's covers are designed boxes that have to hold
  still whatever is dropped in — the ring's shape is one number by
  construction (trap 26), and covers of eight different heights would not
  be a ring. `Shot` takes `size` for the first case and `ratio` for the
  second: which one is right is a property of the place, not of the image.

The rail was re-verified whole, since the thumbnails now differ in shape:
108 marker positions with a worst step of **0.25px** on the two-shot page,
139 and 0.35px on the three-shot one, `aria-current` agreeing with the
marker at `dTop` 0 / `dH` 0, 13.3ms median with zero frames over 20ms, and
three distinct positions under `reduce`.

**28. There are two curtains, and a reveal has to wait for both.**
`useReleased` watched `data-preloading` and nothing else, so on an in-app
route change it found no attribute and concluded the page had been handed
back — while the ink panel was closed over it. The reveals ran beautifully
in a room with the lights off. Measured going from `/works` to `/`: the
panel finished closing at **461ms**, the intro's `data-in` flipped at
**635ms**, and the panel did not clear the top of the screen until
**1223ms**, by which point the 620ms rise was three quarters done. Nothing
was broken; it was all just spent where nobody could see it.

`PageTransition` now raises its own `data-routing` on `<html>` for as long
as it is in the way, and `useReleased` waits for the absence of *either*
flag. Three things about that:

- **It is a second attribute, not a reuse of the first.** `data-preloading`
  is load-time machinery — `global.css` keys the entry curtain's display,
  `animation-play-state: paused` on everything, and a scroll lock off it
  (trap 10). Raising it during a route change would pause every animation
  on the page and switch on a second scroll lock beside the one this
  curtain already holds through Lenis. `data-routing` drives nothing but
  this question.
- **The release is at the END of the uncover, not the start.** The panel
  rises to uncover, so it lets go of the bottom of the screen first and the
  top of it last — and the top is exactly where the block waiting on `load`
  sits. Releasing when the tween starts would put the rise behind the part
  of the panel that has not moved yet. Verified: 32 frames with the intro
  mounted behind a visible panel, every one of them parked at the same
  `y` of 31.9 with `data-in` false; the panel gone at 1219ms, `data-in`
  true at 1260ms, the travel from 1401ms to 1762ms — all of it in view.
- **It comes down everywhere the curtain does**, which is the same promise
  as "the route curtain must always let go": in `settle`, and in the
  effect's cleanup for an unmount mid-transition. A flag left up parks every
  masked block on the page permanently, which is a worse failure than the
  one it was added to fix. Verified on the slow path (destination held
  1.8s: held 2986ms, then released, intro revealed) and on the 3s hard cap
  (attribute gone, scroll lock released, page arrived).

The cold load is untouched by all of this — `data-routing` is never set
there. Verified: preloader released at 1585ms, `data-in` true at 1600ms,
parked at 31.9 for 112 held frames, exactly as before.

**29. Masking display type: push the clip out, take the space back.**
Trap 28 got the reveals to play in front of the reader instead of behind
the panel, and it was still not enough, because of what there was to see.
Measured on arrival at the index, 1440x900: the masthead occupied 293-515
and did not move, the intro's two lines moved **31.9px** each at 578 and
609, and `#work` began at exactly 900 — off screen. The whole gesture was
two lines of a 20px paragraph, no opacity change, on a dead screen. The
reference masks its **headline** type, 64px lines travelling 64px, fifteen
of them in a wave. Timing was never the difference; scale was.

So the big type moves now, and `.st-mast` is how it can:

- **The clip is pushed out with padding and the space is taken straight
  back with a negative margin of the same size.** `.st-display` sets
  `line-height: 0.9`, tighter than Nippo's ascent plus descent, so the caps
  and the descenders hang outside the box a mask would cut at. `.st-roll`
  dodges that on `/works` by taking the face's own box (trap 26) and here
  that is not available — the 0.9 is load-bearing, because the preloader
  lands its letters on this exact line. `padding-block: 0.2em` with
  `margin-block: -0.2em` moves the clip and not the heading. Verified: the
  `<h1>`'s rect is `46.57,292.72 1331.86x222.30` with the mask and
  **identical** without it, at 320, 768 and 1440.
- **The travel has to clear the widened clip, not the line.** At the 105%
  the prose masks use, the ink still showed through the padding. 145% is
  the line box plus both paddings plus the overhang — verified by reading
  where the glyphs actually are: parked, the ink sits **50.6px** below the
  clip edge.
- **Check the ink, not a screenshot.** At rest the headroom between the
  real ink and the clip, measured with `measureText` at each width, is
  13.0/4.0px at 320, 15.5/4.9 at 375, 17.3/5.5 at 414, 34.0/10.2 at 768 and
  64.3/19.7 at 1440 (top/bottom). All positive, and the tightest is the
  descender at 320. A longer name, a deeper descender or Vietnamese
  diacritics will move those numbers — re-read them before changing
  `PROFILE`, the way the computed font-size has to be re-read at 320.
- **The padding is real box and it hangs over what is below.** 49px of it
  at 1440, across the top of the paragraph under the masthead. Nothing
  there is clickable — verified, the only overlapped element with a
  tabindex is `<main>` itself — but a selection drag starting on that
  paragraph would have begun on the mask. `pointer-events: none` on the
  mask and `auto` on the line gives the hits back without making the name
  unselectable.
- **The load path has no mask in it at all**, rather than a mask that
  happens to be open. `Headline` returns the bare string when it is not
  wanted, so the markup the preloader hands over to is byte-for-byte what
  it always was. Verified: `h1.innerHTML` is `Max Huynh` at every width on
  a cold load.

**The same 0.185em is also what goes UNDER the masthead**, and for the
same reason read the other way round: the ink hangs that far past the
heading's box, and whatever is set after the heading measures its margin
from the box. The paragraph under the name had a constant 31.5px margin
against a descender that grows with `--fit-size`, so the gap between the
two closed as the name got bigger — measured on a 900px viewport, 25.5px
at 320, 15.7 at 768, **1.8 at 1440** and **-8.6 at 1920**, where the tail
of the `y` sat in the text. It looked correct at whatever width it was
built at, which is trap 11 again: one fixed number against a heading whose
size is solved per width. `mb-[0.185em]` on the `<h1>` is that number
expressed as the heading's own size, and the gap now runs 24.3 / 32.4 /
36.0 / 44.1 / 47.5 / 59.3 from 320 up.

A **margin**, not padding, and that is load-bearing: the preloader reads
`getBoundingClientRect().top` of this element — the border box — to place
its letters, so padding would move the target out from under a handover
that is exact to the pixel. A margin leaves the box alone.

It is also the FACE's overhang and not this string's ink, so a name with
no descender sits the same distance off what follows it rather than
snapping closed. (When checking that handover, note that a `[data-letter]`
span's rect is the 0.9 line box and a `Range`'s rect over the same
character is the face's 1.269em box: comparing them shows a phantom 44.5px
offset at 1440 that is present with or without this margin. Run the
control — it was run here, and the numbers were identical.)

And one thing that is not a mask: `.st-wash` fades the first shot in,
because an image has no lines. That is not the fade-up this file threw out
— that was one treatment on all seven blocks of a page. This is a single
element, carrying no movement at all, beside a name that is masked and a
column that is.

Measured after: **15** elements moving on screen when a project page opens,
resting 50ms apart from 1763ms to 2016ms with the name's 391.5px rise
landing at 2003ms; the panel gone at 1229ms, so all of it is in view. Two
frames over 20ms in the whole navigation, **both behind the closed panel**
during the route commit, and **zero** after the uncover. Under `reduce` the
heading takes **2** positions, 0.00 and 1.45 of its own height, against
**37** with ordinary motion — it arrives, it does not travel.

**31. A scrubbed value is written, not tweened.**
The wipe above started life as a 420ms GSAP tween fired whenever the live
row changed. That is the third time this repo has had to learn the same
thing — the ring's readout parked on whole projects and transitioned
between them (trap 21), the thumbnail rail outlined whichever shot was
nearest (trap 25) — and the answer is the same every time: take the
reader's continuous position and write the pose from it every frame.

`Work` already had that number in all but name; it was throwing the
fraction away and keeping `Math.round`. Keeping it gives the edge its
position directly, and gives the list's colour the rounded one, so the live
name and the live picture are two readings of one number and cannot
disagree.

- **Both directions come free.** The layer the position is heading for is
  placed at `(1 - part)` of a frame-height; scrolling back up simply runs
  `part` backwards. There is no reverse case written anywhere, which is why
  there is no reverse case to get wrong.
- **Assigned, not eased — while it is the scroll.** Easing toward a scroll
  target would be the "second opinion, always a few frames behind" that
  trap 21 exists to record. Measured against an independent reading of the
  reader's own position across 331 frames of scrolling down and back up:
  worst error **0.0223 of a row**, median and 95th percentile **0**, and
  nothing above 0.1.
- **The pointer is not a position, so it is the one thing that eases.**
  Hovering the seventh row takes the edge to exactly 6, leaving the list
  hands it back to the scroll's own 2.01, and it crosses in 39 distinct
  positions rather than jumping.
- **GSAP is gone from this file**, and that is the point rather than a
  regret: a tween has a duration, and this does not. It stays where it is
  still the right tool — the two curtains, which answer a click and a load
  rather than a position.

Verified: scrolling down the edge only ever rises (163 rising frames, **0**
falling) and scrolling up it only ever falls (**0** rising, 164 falling);
174 distinct edge positions across one pass; parking the scroll exactly
between two rows holds the edge at **0.497** and leaves it there; 13.3-13.4ms
median with **zero** frames over 20ms at every width; and under `reduce` the
edge is only ever at 0 — the preview stands on whole projects, the same
answer the rail gives.

**30. A `key` is an instruction to throw the subtree away.**
The index's preview was one block carrying `key={current.slug}`, so every
change of the live row destroyed it and built a new one — a new `<img>`
element, with the fetch, the decode and the empty box that go with it. The
180ms cross-fade over the top could not hide that, because it was fading
*in* a picture that had not arrived: measured while bouncing between the
two projects that have real covers, **126 of 235 frames — 54% — had an
`<img>` in the DOM that was not decoded**. That blank box is the flash.

Every project's preview is mounted once now and they are stacked, so
nothing is created or destroyed when the row changes and every cover is
already decoded. Same measurement after: **0 of 235**.

Four things it is worth keeping:

- **Stack them in a grid cell, not with `position: absolute`.** A grid cell
  is sized by its tallest occupant, so the frame has a height without one
  having to be supplied from somewhere, and it cannot jump when a longer
  summary becomes live.
- **EVERY layer clips, not just the stack around them.** The layer travels
  up and its contents travel down inside it by the same amount; without
  `overflow: clip` on the layer itself, those contents hang out of the top
  and paint over the project underneath. The layer's opaque background
  covers the slice it has reached and its text does not, so two projects'
  numbers sit on top of each other. **Nothing in the numbers caught this** —
  net drift, decoded frames and frame times were all already perfect. It
  was visible the moment the wipe was actually photographed, which is why
  it is worth slowing a 420ms gesture down and looking at it.
- **Z-order has to be recency, not `index === active`.** During a wipe the
  part the incoming layer has not covered yet shows whatever is highest
  underneath, and with everything on one z-index that is the last layer in
  DOM order rather than the one the reader was just looking at. A counter
  incremented per activation, written inline, is what decides; the CSS rule
  keyed off `data-on` only has to be right for the first paint.
- **Entering only.** Interruption is the normal case here, not the edge
  case — scrolling moves the live row every few frames. A layer caught
  mid-wipe is simply covered by the one that follows it, so there is
  nothing to strand and nothing to reconcile.

Verified: the picture's net drift **0** at every frame of every wipe,
13.3ms median with **zero** frames over 20ms, and under `reduce` the
preview stands on whole projects.

(The z-order note above is what the recency counter was for while the wipe
was a fired tween. Scrubbed, it is simpler still: the layer the position has
passed is 1, the one it is heading for is 2, everything else 0 — read off
the position rather than remembered. See trap 31.)

**32. A transition needs a value to come FROM, and a measured block has
none on its first commit.**
This is the bug behind "the curtain lifts and no text animates", reported
three times and mis-diagnosed twice, because the two obvious paths —
`/works` to `/`, and one project to the next — were always green.

`Reveal` and `Headline` render their line on the very first commit, parked,
so the browser always has a previous computed transform to interpolate
from. `Lines` cannot: it has to measure where the paragraph breaks before it
can split it, so the `.st-line-body` spans do not exist until a later
commit. If the page has already been let go by then, those spans are
**inserted with the ancestor already at `data-in="true"`** — and a newly
inserted element's first computed style is simply `transform: none`. There
is nothing to transition from, so nothing transitions. Measured on the
failing paths: **one** distinct transform across 264 frames.

Release beats the measurement on two navigations, and neither is exotic:

- **Back and forward.** `PageTransition` listens for `click` only. History
  navigation raises no curtain, so `useReleased` latches about a frame after
  mount — long before the split lands.
- **Any destination slower than `HARD_CAP_MS`.** The cap is 3s, and in
  `next dev` an on-demand route compile routinely exceeds it. Measured:
  `data-routing` dropped at 3871ms with the curtain sweeping off the OLD
  page, the new page mounted at 5019ms, and the prose was born true at
  5022ms. **That is the everyday development repro**, which is exactly why
  it survived two rounds of measuring warm routes.

The fix is one frame: `Lines` holds `data-in="false"` on the commit that
first has lines, and lets the reveal through on the next frame, by which
time the parked pose has been through a real style recalculation. A
`Promise.resolve()` would not do — it runs inside the same one. After:
born parked on both paths, **32** distinct transforms past the cap and
**33** on a Back, against one before.

Two things found alongside it and worth keeping:

- **`useReveal`'s `seen` was latched in a `useState` initialiser** from the
  `on` prop, which is read exactly once. Every other latch in this machinery
  fails open — text appears without its animation — but that one could fail
  closed, which is text that never appears. It is a plain derivation now.
- **`Lines` re-splits when its `children` change.** Today Next keys every
  dynamic segment by its param value, so `/work/hylix` to `/work/soluis`
  remounts rather than reuses and this is belt and braces. It is not belt
  and braces in development, where Fast Refresh preserves state and an
  edited paragraph would otherwise keep rendering the old lines.

**Still true, and deliberately not changed:** Back and forward raise no
curtain at all, so the arrival plays on an already-visible page rather than
out from behind a panel. The reveals are correct there now; the choreography
is not the click path's. Giving `popstate` its own curtain is the fix if
that ever matters.

**Before debugging this again, ask whether the reader has Reduce Motion on.**
`global.css` flattens every transition to 0.01ms, so under it *no* reveal
on this site plays, on any path, and no amount of JavaScript will change
that. It is the one explanation that looks identical to every bug above.

**34. Blank the destination for the hold, and only the hold.**
The complaint was that every arrival looked finished by the time the panel
slid away, and it was accurate: the panel uncovers over 560ms but
`data-routing` was not dropped until `settle()` at the end of that sweep, so
the reader spent the whole sweep looking at a destination whose un-gated
parts were already at rest. Most of the page has no arrival — after the
scroll reset the visible ones are the corner marks, the index's preview
aside, a project page's thumbnail rail and the readout's static `/ 08`.

The fix is a gate, and what it is NOT matters as much as what it is:

- **Not a page-wide fade.** That is the pattern this file threw out, at page
  scale — "the same fade-and-slide-up on all seven sections" — and it would
  be a sixth motion source needing its own reduced-motion check. The gate
  is a property FLIP under a closed panel, where nobody can see it happen.
- **`opacity`, never `visibility` or `display`.** All three take the page
  off the screen; only opacity costs nothing. `display: none` and
  `content-visibility: hidden` skip layout for descendants and break the
  three things here that measure — `useFittedText` reads a zero container
  and never writes `--fit-size`, `Lines` reads collapsed Range rects and
  splits a paragraph into one bogus line, and the ring's `measure()` bails
  on a zero box. `visibility: hidden` keeps layout but is not focusable, and
  `reveal()` moves focus to `#content` BEFORE the attribute drops, so it
  would silently break "a navigation moves focus".
- **Never a `@keyframes` animation.** `html[data-preloading] *` pauses
  animations unlayered (trap 10), and a `both`-filled one would freeze at
  `from` — a blank page, for good.
- **Keyed on `data-routing` only.** The load curtain's contract is that the
  paper dissolves onto an `<h1>` already in place, exact to the pixel, and
  it lets go mid-dissolve. Blanking there would pop the whole index in
  through a half-faded sheet. Verified: on a cold load the attribute is
  never set and `#content` is opacity 1 on every frame.
- **The phase lives in the attribute's VALUE**, not a second attribute.
  `useReleased` asks `hasAttribute` and observes with an `attributeFilter`,
  so all three values read as "a curtain is up" and a change from one to the
  next just re-fires the observer. One thing to clear, not two.

**And the cap had to be re-armed before any of this could ship.** `reveal()`
used to CLEAR the hold's timer and then start the uncover, so nothing
covered the uncover itself — and the uncover is a GSAP tween on rAF, which a
backgrounded tab suspends. `onComplete` never fires, `settle` never runs,
the attribute stays up. That used to mean some parked text on a visible
page; with a gate it means a blank one. "The route curtain must always let
go" now has to cover the sweep too, so the timer is re-armed rather than
cleared.

Measured across one navigation: `covering` 0–477ms with `#content` at
opacity **1**, `holding` 497–544ms at **0**, `leaving` 563–1158ms at **1**,
attribute gone at 1173ms. Every navigation tried — index to project, project
to project, `/works` to index, and under `reduce` — ends with the attribute
gone and `#content` at 1.

Separately, `/works` was spending its 340ms lead as dead air on the click
path. That lead exists for the preloader's mid-dissolve release; the route
panel hands over a clear screen, so the lead is now conditional on
`useViaRoute`. The ring starts turning **53ms** after release instead of
340, with the revolution unchanged at 126 distinct positions.

**35. Three ways an arrival can be finished before anyone sees it.**
All three were found by tracing what is actually *on screen* during the
uncover rather than by checking that the animations ran — they all ran
perfectly.

- **A whole revolution is a no-op modulo the count.** `shortest(i - 8, 8)`
  and `shortest(i, 8)` are the same number, so the ring's first frame and
  its last are the SAME pose. The covers sat at their finished position,
  pixel-for-pixel against the settled reference, for the entire 450ms
  uncover — and then jumped away and spun back, 106ms after the panel had
  gone. The page looked done and then animated anyway. The reference can
  turn without fading because it has no curtain: its wheel is already moving
  15ms after load. Ours comes out from behind a panel, so the covers fade in
  across the first 40% of the turn. Measured after: **72 frames of the
  uncover with the covers at opacity 0**, then 198 distinct positions.
- **A uniform push cannot empty a mask whose lines are closer together than
  it is tall.** The readout's lines sit 110% apart in a 100% window, so
  pushing every line down by 100% to park them lands the line BEFORE the
  current one at -10% — dead centre. The arrival showed "08 Project Eight
  2022" while the ring was on Hylix. There is no uniform offset that hides
  all of them; the stack has to SPREAD as it goes, `away * (110 + up) + up`.
  Measured after: no line in the window on any frame of the arrival.
- **`useViaRoute` cannot rely on the attribute when the cap fires.** The 3s
  cap lets the curtain go *before* the destination mounts — attribute gone
  at 3625ms, page mounted at 4785ms — so the page read no attribute and
  concluded it was a cold load, and `Headline enabled={viaRoute}` gave the
  masthead no mask at all. The largest thing on the page, never revealed, on
  the one path where the reader has already waited longest. A module-scope
  "this document has navigated" flag, set when `go()` runs, answers the
  question the attribute was standing in for.

**What the same trace exonerated**: on `/` and `/work/<slug>` the uncover
frame is blank paper — 14/14 and 3/3 masked items parked, nothing started,
earliest motion anywhere +106ms after the panel is gone. What is on screen
there is the fixed corner chrome, which is identical on the page you left
and never re-renders on a route change. It reads as "already finished"
because it never went away. It is furniture, not arrival, and animating it
would be animating the one thing on the site that is meant to be continuous.

**36. Type sits on a line, not in a box — so align baselines, and give
each row its own.**
The readout on `/works` is a number, a name and a year set at two different
sizes, with a counter and a one-line summary under them. It was a
three-column grid on `items-start`, which aligns the tops of boxes — and the
taller type's baseline is further down its box by the difference in ascent.
Measured: the number's baseline sat **6px** above the name's at 320, 10 at
768, **14 at 1024**, 9 at 1440. It moves with the width because the two
clamps do not hold a fixed ratio across their range, so no single nudge
could have fixed it.

`items-baseline` fixes the first row on its own. It does not fix the second,
because with the rows stacked inside three column wrappers only the first
item of each column can take part — `/ 08` and the summary started from
whatever height the box above them happened to be, and were 1.5px apart at
375 and 4px at 1024. Grid baseline alignment groups by ROW, so the structure
has to match what is meant to line up: six cells in two rows, not three
columns each holding a stack.

**Measure the baseline by asking the browser, not the font.** Deriving it as
`boxTop + fontBoundingBoxAscent` from a canvas reported a 0.5px error where
there was none — those metrics round differently at different sizes. A
zero-size `inline-block` appended to the line sits with its bottom margin
edge exactly on the baseline, which is the browser's own answer. With that
probe the two approaches were distinguishable: the arithmetic fix measured
0, `items-baseline` measured 0, and the 0.5px was the measurement.

Verified independently at 320 / 360 / 375 / 414 / 600 / 768 / 900 / 1024 /
1280 / 1440 / 1680 / 1920: both rows land on **bit-identical baselines** —
not "within a pixel" — despite genuinely different sizes in row one (46.575px
number against 55.89px name at 1440). No horizontal or vertical document
overflow, the section fits the viewport exactly, and nothing is clipped: the
tightest case is `Hylix`'s descender with 2.27px of clearance at 320.

**And the controls were run, because a zero nobody has made fail is not a
measurement.** Forcing `align-items: start` back on put row one's spread at
6.5px at 320, 14.5px at 1024 and 10px at 1440 — independently reproducing
the numbers above. Row two needed a harder control, because both its items
are 11.7px and top-alignment would agree with baseline-alignment by
coincidence: blown up to 34px the counter stayed exactly coincident under
`items-baseline` and split by 24.5px under `items-start`. So row two is
aligned by construction, not by accident.

Two things that will bite the next person measuring this page:
`page.addInitScript` ACCUMULATES across calls on one page, so a second
sampling run silently registers the rAF loop twice and halves the apparent
frame time. And `ol li` matches the list view's eight rows as well as the
ring's eight covers — scope to the covers or measure the wrong `<ol>` and
conclude they never move.

(A hand-computed lift — `ascent x (nameSize - sideSize)` — also measured
exactly 0, and was rejected: it needs Nippo's ascent ratio hard-coded, and
trap 26 already records the preference for arrangements where no number in
this repo has to be kept in step with the face.)

## Accessibility invariants

Measured in the browser, not computed from the tokens alone: `--ink`
16.09:1, `--ink-2` 5.05:1, `--ink-3` 3.88:1, and `--ink` on `--well`
12.87:1. A full sweep of every text node returns zero failures against the
size-appropriate bar on all three page types — 60 nodes on the ring, 91 on
the list, at 320 and at 1440, with the control confirming the sweep can
still fail.

**`--ink-3` is only safe as LARGE text, and "large" for bold type starts
at 18.66px.** It dims the work list's rows, which are never that small.
The preloader's pending name is not display-sized: at 320px it computes to
about 17px, where the bar is 4.5:1 and `--ink-3` fails. It uses `--ink-2`
instead. Check the computed `font-size` at 320, not the one you designed
at 1440.

**Always run the control.** A sweep that reports zero failures is worthless
until you have made it report one: paint a single small label at a failing
value, confirm the count goes 0 → 1, then restore it.

**Two measurement traps, both of which produced wrong answers here:**

- **Counting `getClientRects()` to detect a two-line clickable is wrong.**
  A single-line inline element returns one rect *per text node*, so
  `{first} {last}` in JSX yields three rects on one line and every run
  flagged the masthead link. Count **distinct rounded `y` values** instead.
  (The version before that compared height to line-height, which counted
  padding as a second line. Both were false positives at every width.)
- Do not filter screenshot pixels by luminance to find a backdrop. Text
  antialiasing covers every intermediate value, so "the brightest mid-tone"
  is a letter edge and the number comes back identical everywhere.

Other invariants:

- **Do not dim whole rows.** `Work` dims only the large title; the readout
  beside it stays at full ink.
- **The fixed corner marks must stay opaque behind their own text.** The
  paper gradient behind each row is what stops body copy sliding under
  them; `pointer-events` is off on the gradient and back on for the text,
  or the bands swallow clicks across the full width.
- **Visual echoes are `aria-hidden`, and what they echo must exist
  elsewhere.** The index's preview aside is hidden, so each row's summary,
  category and year live in the link's own accessible name. The empty
  `Shot` field is hidden, so its label never leaks into a link's name —
  that is the trap the old `ImageWell` hit.
- **State is never carried by appearance alone.** The thumbnail rail's
  current shot has `aria-current` as well as an outline. The outline is one
  marker placed every frame from a continuous read, not a class on the
  button — but both are decided by rounding the *same* number, so the
  outline can never sit on one thumbnail while `aria-current` names
  another. Verified: the marker matches the current thumbnail at `dTop` 0,
  `dLeft` 0, `dW` 0.
- The line is shown **assembled rather than assembling** under
  `prefers-reduced-motion`: nine letters each travelling more than their
  own height is a large movement, which is the query's central case. The
  hold still runs and the status line still announces; the plate is simply
  static, and it still lands on the masthead to the pixel. The paper itself
  still fades in, because an opacity change is not the movement the query
  is about — the same call `PageTransition` makes.
- The index's and the project pages' reveals are CSS transitions on one
  property, so the reduced-motion block flattens them to 0.01ms and the
  text simply arrives. Verified: `transition-duration` 1e-05s, the intro
  at its resting position, the masthead at **2** distinct positions across
  a whole arrival against 37 with ordinary motion, and the first shot at
  full opacity. Nothing there needs its own check.
- The `/works` arrival reads the query once at the start and assigns its
  scalar to the end instead of walking it — the same shape the gather uses,
  and for the same reason: a rAF loop is somewhere the CSS block cannot
  reach. The reference suppresses its own arrival entirely rather than
  shortening it, which is what this does too.
- Six things honour `prefers-reduced-motion` — the CSS block, Lenis
  (which is not constructed at all under `reduce`), the preloader (which
  shows the line assembled instead of assembling), `PageTransition` (which
  drops the wipe for a fade) and `/works`, where both the ring and the
  gather between views are assigned rather than walked. The last three read
  the query in JavaScript, because the CSS block cannot reach a GSAP tween
  or a rAF loop; add a sixth motion source and it will need its own check
  too. The list's rows are the exception that proves it: their rise is a CSS
  transition, so the block flattens it to 0.01ms without the component
  asking. Verified under `reduce`: the switch shows **two** distinct cover
  scales across 114 frames — the ring's and the deck's, and nothing
  between. Verified under `reduce`: the panel never translates, only fades, and
  the navigation still lands at the top; and the ring never eases — 245
  sampled frames across a gesture, **zero** of them between two projects,
  because every gesture is quantised to whole steps and the position is
  assigned rather than tweened — and since the readout is placed from that
  same position, its lines simply arrive too: 213 sampled frames, every one
  of them on a whole step (0, ±110, ±220, ±330).
- Motion answers actions, **except on arrival**. This used to read "the
  only non-user-triggered motion is the single load gesture", and that
  stopped being true in stages rather than all at once: the index's masked
  lines, the fifteen elements a project page brings up, and now `/works`
  turning its ring. Rewritten deliberately rather than left to quietly
  become false — what it was guarding against is still banned. What was
  thrown out was ONE treatment applied to every block of a page; what is
  allowed is a composed arrival, on chosen type, seen once per page.
  Everything after the arrival still answers an action: the route curtain a
  click, the ring a wheel, a drag or an arrow key, and the work list's
  preview the reader's own scroll position.
- **A page that takes the wheel owes the reader a way out.** `/works` is
  exactly one screen tall in both views and the document never scrolls.
  That is defensible only because the `list` view is one click away, is
  reachable by keyboard before either set of links is (the switch sits
  earlier in the tab order than both), shows all eight names at once, and
  carries the same links. Where the rows do not fit — measured at 320x568,
  and nowhere else — the list is a plain scroll region the wheel drives
  natively; it is not hijacked, it is just not the document. The two
  buttons say which view is on with `aria-pressed`, not with the underline
  alone.
- **`.st-quiet-scroll` is not a general-purpose class.** It removes the
  painted scrollbar and nothing else — the wheel, touch and
  scroll-into-view all still work — and it is applied to exactly one
  element, whose content is sized to fit first. A hidden bar on a region
  that genuinely overflows is how a page ends up cutting its own content
  off without saying so.
- **Both views are always mounted, and exactly one of them is live.** The
  covers and the rows are two sets of links to the same eight projects, so
  the set that is not the current view carries `inert` *and* `aria-hidden`:
  in the ring the rows are parked inside their masks and out of the tree, and
  in the list the covers are the preview — a visual echo, which is the same
  rule the index's aside follows. Verified both ways: tabbing in the ring
  goes switch then covers, and in the list switch then rows, with the other
  set skipped entirely.
- **The ring's readout is `aria-hidden`,** so the name, the one-line
  summary, the category and the year all live in each cover link's own
  accessible name — the same rule the index's preview aside follows.
- The list's rows dim to `--ink-2`, not `--ink-3`. At 320 the name computes
  to about 17px, under the 18.66px where bold type counts as large, so the
  bar is 4.5:1 and `--ink-3` (3.88:1) fails it. Only the name dims; the
  number and the metadata beside it stay put.
- **The route curtain must always let go.** `PageTransition` caps the hold
  at 3s and reveals anyway; its cleanup calls `lenis.start()` even if the
  component unmounts mid-transition. A reader stuck behind a panel with
  scrolling switched off is the worst failure this file can produce. The
  `data-routing` flag comes down on every one of those paths too (trap 28),
  because a reader left with scrolling back but the page's text parked
  forever is the second worst.
- **A navigation moves focus.** `preventDefault()` cancels the browser's
  own focus move along with the jump, so the curtain puts focus on
  `#content` (which carries `tabindex="-1"`) before it lifts.

## Verify before claiming

Run `yarn build` and `npx tsc --noEmit`. For UI, inspect the DOM rather
than trusting a screenshot: **if the Browser pane is hidden, screenshots
come back solid black** even though the page renders fine. A hidden pane
also reports `document.hidden === true` and fires **zero rAF callbacks**, so
the preloader never places its line and the curtain looks stuck on blank
paper. That is the harness, not a bug. Drive those through Playwright, which composites for
real.

**Read the class off the live element before believing the source.** This
file records the dev server serving stale CSS, and that is real — but the
same symptom has also been an edit that never landed. A scripted
find-and-replace that asserts only "something changed" will happily apply
one hunk of three and report success, and the browser then correctly shows
the old markup. Assert every replacement, and check
`element.className` in the page against what the file says before
concluding the server is at fault.

The dev server has served stale CSS twice after a rewrite of
`global.css`. If a token or a new rule appears not to apply, restart it
before debugging anything else — and read the built chunk (trap 17) before
concluding the source is wrong.

**Both curtains are too short to watch across a tool round-trip.** They are
gone before a second call can look at them, so drive each one from inside a
single Playwright snippet.

- *The route curtain* (~1.15s): `page.route()` the destination with a delay
  — `'**/work/project-five**'` held for 1800ms — and the covered wait
  becomes long enough to photograph. That is also the honest test of "wait
  for the new page", because the panel has to sit closed until it arrives.
  Scroll a long way down first, or "always starts at the top" is not being
  tested at all.
- *The entry curtain* (~1.8s including the dissolve): nothing to hook. Raise
  `MIN_HOLD_MS` to 6000, observe, then put it back — and check that the
  dev server actually rebuilt, because a stale bundle will hold for 1.2s
  and quietly make the test meaningless.

  Raising it is not optional for a pixel comparison against the masthead.
  The letters finish at about the same moment the exit begins, so the last
  frame the curtain is *visible* on is already a third of the way through
  the dissolve: comparing there compares a blend of the two pictures, not
  the two pictures. The measured "differences" are then the cross-fade.

**Smoothness is a number, not an impression.** Sample
`requestAnimationFrame` deltas across the whole transition and count the
frames over 20ms. The crossfade version scored a 13.4ms median with zero
long tasks and still looked broken — which is how it was established that
the problem was the scroll offset, not the frame budget.

Responsive is checked at **320 / 375 / 414 / 768 / 1440**, on the index,
on a project page *and* on `/works` in both of its views: no horizontal
scroll, `overflow-x: clip` on both `html` and `body` (`clip`, never
`hidden` — `hidden` makes the element a scroll container and breaks
`position: fixed` on descendants), no clickable wrapping to two lines, and
nothing extending past the viewport edge.

The ring is the one exception to that last item, and it is a deliberate
one: the outer covers are *meant* to run off the sides. They cannot make
the page scroll, because the surface they sit on is full-bleed and carries
`overflow: clip` — which also stops the ones that have dropped below the
ring from lengthening the page. Check `scrollWidth - clientWidth`, not
whether a box crosses the viewport edge. Measured at every width: no
horizontal scroll, `docScroll` 0 with the ring up, and nothing cut off at
the bottom of the stage.

Run the 3dviz-pro-max skill's scripts with `/opt/homebrew/bin/python3.12`;
the system `python3` is the Xcode stub and needs a sudo license agreement.
