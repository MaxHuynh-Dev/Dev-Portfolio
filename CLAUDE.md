@AGENTS.md

# Dev-Portfolio

A portfolio for a front-end engineer, on warm paper (`#efedea`) with true
ink type and **no accent colour at all**. Emphasis is carried by size,
weight and position; hover and focus by an underline. The only colour the
site will ever have is the project imagery.

Three kinds of page:

- **`/`** — the index. Masthead, work list, about, contact. The work list
  is the way in: one row is live at a time and its cover, summary and
  position sit beside it at eye level.
- **`/works`** — all of it, on a ring. The covers hang on the rim of a
  circle whose centre is far below the page; the wheel, a drag or the
  arrow keys turn it, and a readout above rolls with it — number, name,
  one line and year, all placed from the same continuous position the
  covers are, so half a turn leaves the name half out of its mask. A `list` view beside it shows the same projects as a plain,
  ordinary-scrolling page. Reached from the corner marks as `all work`.
- **`/work/<slug>`** — one page per project. A sticky spec sheet on the
  left, a stack of shots down the middle, a rail of thumbnails on the
  right, and the next project at the foot.

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

**Moving between pages** (`PageTransition`). An ink panel rises to cover
the page, the next route is fetched and committed behind it, the scroll is
put back to the top, and the panel carries on upward to uncover. One
direction throughout — it never comes back down the way it came. The
destination's name sits on the panel in paper while you wait, which is the
same foot-left position the preloader puts its name in.

The inversion is not a new colour. `::selection` has always drawn this
site's type paper-on-ink, so the curtain is the page's own palette turned
over for a second rather than a second palette.

**The route is only pushed once the panel is closed.** Push during the rise
and React commits the new page while the top of the screen still shows the
old one — a visible jump, which is the whole thing this exists to remove.
`router.prefetch` at click time is what keeps that ordering cheap.

Durations live in `global.css` as `--t-quick`, `--t-cover`, `--t-reveal`
and `--t-handoff`. Only the first is used by CSS; the other three are read
off the computed style by the two components, because a CSS animation
cannot wait for a webfont or a route. Do not invent a fifth at a call site.

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

**23. An indicator quantised to N places cannot track a continuous scroll.**
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

**24. Four things on the ring are measured, not chosen.**

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
- Five things honour `prefers-reduced-motion` — the CSS block, Lenis
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
- Motion answers actions. The only non-user-triggered motion is the single
  load gesture: the letters assembling into the masthead's own line, and
  the page being let go mid-dissolve. The route curtain answers a click,
  and the ring answers a wheel, a drag or an arrow key.
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
  scrolling switched off is the worst failure this file can produce.
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
