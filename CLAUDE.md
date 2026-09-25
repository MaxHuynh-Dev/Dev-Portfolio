@AGENTS.md

# Dev-Portfolio

A portfolio for a front-end engineer, on warm paper (`#efedea`) with true
ink type and **no accent colour at all**. Emphasis is carried by size,
weight and position; hover and focus by an underline. The only colour the
site will ever have is the project imagery.

Five kinds of page:

- **`/`** — the index, and it is **one screen that does not scroll**
  (trap 41). The masthead **and contact**, and nothing else at all.
  Everything that used to sit under it has left, a piece at a time and each
  for its own reason: the colophon and About went to `/about` (trap 39),
  contact came UP out of the foot to sit under the start of the masthead
  (trap 38), and the work list went to `/works`, which was already showing
  the same eight projects. The corner mark that used to scroll the reader
  down this page is the one that goes there now.
- **`/works`** — all of it, on a ring. The covers hang on the rim of a
  circle whose centre is far below the page; the wheel, a drag or the
  arrow keys turn it, and a readout above rolls with it — number, name,
  one line and year, all placed from the same continuous position the
  covers are, so half a turn leaves the name half out of its mask. A `list` view beside it shows the same projects as a plain,
  ordinary-scrolling page. Reached from the corner marks as `work`, and it
  names itself the same: it is the only place the work is listed now, so
  `all` would be a comparison with nothing.
- **`/work/<slug>`** — one page per project. A sticky spec sheet on the
  left, a stack of shots down the middle, a rail of thumbnails on the
  right, and the next project at the foot. The shots are shown at their
  own proportions — full width, height auto — and so are the thumbnails
  beside them.
- **`/about`** — the person, on **one screen** (trap 43). A statement in
  display type that BREAKS into its own measured lines, then the project
  page's grammar underneath it: a narrow column of what he does, the prose
  in the middle, and a portrait where the project page puts its rail. On a
  phone the lists and the portrait share a row rather than stacking.
  Reached from the corner marks as `about`. See traps 39 and 43.
- **`/experience`** — where he has worked, newest first, from the
  `experience` collection. The project page's grammar on its side: the
  year the job started in a narrow left column, counting itself in on an
  odometer (`Odometer.tsx`), the company and the responsibilities in the
  middle, `stack` / `projects` in a third column above `lg`. It is the one
  page whose content is ALLOWED to run past the screen — a CV grows — so it
  is the one page that reveals on `scroll`. Reached from the corner marks
  as `experience`, between `work` and `about`.

## Motion

Two of the four moments are a sheet of one colour moving in one direction
while something asynchronous resolves behind it. The other two are steered
by the reader directly: the ring on `/works`, and the masthead's letters
under the pointer.

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

**Leaning on the name** (`usePressure`, the index). The masthead's letters
thin away from the pointer and stay heavy under it — reactbits'
TextPressure, on the one axis Nippo has. The original moves weight, width
and slant; Nippo is weight only, 200 to 700, and the masthead is already at
700, so a letter can only get LIGHTER than it rests: the one nearest the
pointer is exactly as designed and the rest thin with distance, linearly,
reaching 200 at half the name's width. The pointer is chased at the
original's 1/15 per frame, made per-millisecond. The line keeps both its
ends — the first letter is pinned by its left edge and the last by its
right, so the room a thinner letter gives up opens between the letters and
the name still runs margin to margin. It lets go when the pointer leaves the
window or a finger lifts, and never starts under `reduce`. See trap 48.

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

**Only `/experience` reveals on `scroll`.** Every masked block on every
OTHER page waits for `load` — 18 call sites, and all 18 pass `on="load"`,
checked rather than assumed. The index cannot scroll at all now (trap 41),
the address arrives with the opening because that is where it lives (trap
38), and `/about` is a page where everything arrives on `load` with the
colophon alongside it (trap 39).

`useReveal` still HAS a `scroll` trigger, and `Lines` and `Reveal` still
default to it. That was left standing deliberately rather than pruned, on
the argument that the next page might scroll — and `/experience` is that
page. Whatever is on screen when the curtain lets go comes up at once,
because the trigger asks "is it at or above the line"; the rest comes up as
it is reached. Verified: 0 of 28 masked lines left parked after scrolling
to the foot at 1440, 0 of 35 at 375. Trap 24 is the record of how to get it
wrong.

**The odometer** is the one new gesture there. Each digit is a strip of
0–9 three times over in a window one line tall, parked a cell below it, and
rolls up to its digit — the further right, the more turns, all in the same
1.4s, so the low digits spin and the high ones barely move. One CSS
transition keyed off `data-in`, so under `reduce` it takes exactly two
poses, parked and landed. The window is `line-height: normal` for trap 26's
reason, and the company name beside it takes the same box at the same size,
which is what puts the two on one baseline — measured equal tops at 768,
1440 and 1920.

All of this is a reversal of something recorded
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
direction throughout — it never comes back down the way it came, and that
now goes for what is ON it as well as the panel itself.

The destination's name is centred, set in CAPS, and **split into one
clipped mask per character**. It is SEQUENCED, not layered: the panel lands
first, and only then do the letters rise into place, stand for a beat, and
leave upward through those same masks as it opens. It used to sit in the bottom-left gutter and fade on,
which put the one piece of type on a full-bleed panel in the position type
takes when it is a caption. See trap 42.

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

**And the panel only opens onto pictures that are there.** Once the route
has committed, the page is put back at the top under the closed panel and
every image the reader is about to see is waited for — loaded AND decoded —
before the uncover starts: what is on screen, plus anything inside a
`[data-await-images]` region. It is a wait the reader almost never sees:
with the image cache warm the pictures are done during the name's own hold
and the transition is exactly as long as it was. See trap 47.

Durations live in `global.css` as `--t-quick`, `--t-cover`, `--t-reveal`
and `--t-handoff`. Only the first is used by CSS; the other three are read
off the computed style by the two components, because a CSS animation
cannot wait for a webfont or a route. Do not invent a fifth at a call site.

**There used to be a fourth**, and it was the index's work list: every
project's preview stacked in one grid cell, with the live one wiping over
the top, scrubbed from the reader's own position between two rows. It went
with the list (trap 41). Traps 30 and 31 are what it taught and they are
kept, because the lessons are load-bearing elsewhere — the ring's readout
and the project page's thumbnail rail are placed from a continuous position
for exactly the reasons that section records.

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
- no ALL-CAPS labels, no letter-spaced micro-type — labels are lowercase.
  **The route curtain's destination name is the one exception**, and it is
  the exception `.st-display`'s own comment anticipates ("where a line IS
  set in caps it says so locally"). What is banned is an 11px tracked-out
  eyebrow in the flow of a page; that word is display-sized, alone on an
  ink panel, and set in caps at the call site. It also carries POSITIVE
  tracking, which is not the banned letter-spacing but the thing caps
  need — `.st-display`'s -0.035em is cut for lowercase and closes caps up
  until they touch. See trap 42.
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

yarn seed                 # mock content into an EMPTY database
yarn seed:reset           # ...or replace what is there (SEED_RESET=1, NOT a flag)
yarn seed:experience      # the CV's positions, into an EMPTY experience collection
yarn generate:types       # src/payload/payload-types.ts, after any field change
yarn generate:importmap   # app/(payload)/admin/importMap.js, after a config change
```

Biome, not ESLint/Prettier. 2-space, single quotes, semicolons, width 100.
The two generated files are excluded from it in `biome.json`, because both are
rewritten by their generator and formatting them lasts until the next run.

## Where things live

```
app/(frontend)/(withoutFooter)/page.tsx          the index
app/(frontend)/(withoutFooter)/work/[slug]/      one page per project
app/(payload)/             the admin, and Payload's REST + GraphQL routes.
                           A SECOND root layout — see trap 37.
payload.config.ts          collections, globals, the Mongo adapter
src/payload/collections/   Projects | Experience | Media | Users
src/payload/globals/       Profile | About | SiteSettings
src/payload/cloudinary.ts  the Cloudinary storage adapter. SERVER ONLY.
src/payload/seed.ts        mock content for an empty database
src/payload/hooks/revalidateSite.ts  a CMS save goes live — trap 45
src/payload/payload-types.ts   GENERATED. Do not edit.
src/content/site.ts        the SHAPES the site reads. Types only, no imports.
src/content/source.ts      the only thing that talks to the CMS. SERVER ONLY.
src/modules/Studio/
  index.tsx        reads the index's content and hands it to Open
  Open.tsx         the masthead, AND contact — see traps 38 and 41
  Corners.tsx      the fixed chrome at the four edges
src/modules/About/
  index.tsx        /about — statement, prose, portrait. One screen.
src/modules/Experience/
  index.tsx        /experience — one entry per position, newest first
src/components/Odometer.tsx  the year that counts itself in on /experience
src/modules/Library/
  index.tsx        /works — the ring, its geometry, and the view switch
  Readout.tsx      the rolling number / name / year above it
  Roll.tsx         the same projects as a plain list
src/modules/Project/
  index.tsx        the three-column project view
  SpecSheet.tsx | ShotStack.tsx | NextProject.tsx
  PinnedColumn.tsx the spec sheet's sticky column — trap 46
src/components/Shot.tsx    one image, or the field it will go in
src/components/Lines.tsx   prose split into its own measured lines, masked
src/components/Reveal.tsx  the same mask for what is already one line
src/components/Headline.tsx  the mask for display type, inside the heading
src/hooks/useReveal.ts     when a masked block is allowed to come up
src/components/Preloader/  entry curtain + pre-paint boot script (boot.ts)
src/components/PageTransition/  the route curtain, and the only place
                           internal navigation is handled
src/hooks/useFittedText.ts the fitting engine
src/hooks/useCarousel.ts   the ring's position engine
src/hooks/usePressure.ts   the masthead's letters under the pointer — trap 48
src/styles/global.css      design tokens + .st-* primitives
public/fonts/              Nippo (ONE variable file) + Switzer, self-hosted
public/images/work/        project imagery goes here
```

Path aliases: `@Components @Modules @Layout @Hooks @Constants @Utils @Styles @/*`.

There is no header band and no footer band. `Corners.tsx` holds all the
chrome at the four edges of the viewport.

## Type

**Nippo** (display) and **Switzer** (text), both from Fontshare, both
self-hosted via `next/font/local`. Nippo is one variable file on a weight
axis of 200 to 700 — the masthead moves along it (trap 48) — and its
**Regular is at 378 on that axis, not 400**, which is why
`.st-display-reg` asks for 378 by number.

Nippo was chosen by rendering four candidates at the sizes this site
actually uses. That step is not optional — **Array** was the first pick and
had to be thrown out on sight: it is a halftone-dot face that turns to
unreadable noise below about 40px. Cabinet Grotesk and Excon were both too
close to a default geometric sans. Render before you commit.

## Content

**All copy, projects and links live in Payload**, at `/admin`, in four
collections and three globals. Nothing else hardcodes content. Current values
are the placeholders `yarn seed` writes.

`src/content/site.ts` still exists and is still the thing every component
reads, but it holds only the SHAPES now — `Profile`, `Project`, `Shot`,
`MetaColumn`, `LinkColumn`, `SiteSettings`. `src/content/source.ts` is the
only module that talks to the CMS, and it hands back exactly those types.
That split is why the fitting engine, the ring, the masks and the thumbnail
rail did not have to learn a second shape when the content moved out of a
file and into a database: nothing above the read layer knows Payload
exists.

**Server-only, and the client leaves take props.** `source.ts` pulls in the
Payload config, the Mongo adapter and sharp, so it cannot be imported from
`'use client'`. The server components read once and hand down — `MainLayout`
for the profile, `Studio` for the whole index, the two pages for the rest.
That is the same rule trap 5 already states for state.

Imagery is uploaded through the admin and stored on **Cloudinary** (trap
40). Payload hands out the real CDN URL rather than proxying bytes through
`/api/media/file/*`, so a page fetches an image in one hop and nothing is
written to the app's own filesystem. The originals in `public/images/work/`
are kept as the seed's source, not as what the site reads. A `null` `src` is
not a broken state: `Shot` renders a sized, labelled field, so the layout,
the scroll length and the thumbnail rail are all correct before a single
screenshot exists — a shot row with no image attached is exactly that.

**`alt` lives on the Media document, not on a shot.** One file, one
description. The shape it replaced let the same image be given two
different alts in two places, which is one more than can be true.

**The site is statically generated from the database, and a save in
`/admin` puts it live without a build.** `next build` reads Mongo —
`DATABASE_URI` has to be present in the build environment, not just at
runtime — and prerenders every page. `src/payload/hooks/revalidateSite.ts`
then runs after every change to a project, an image or any of the three
globals and calls `revalidatePath('/', 'layout')`: every page, the sitemap
included, is re-rendered from the database on its next visit. It is the
WHOLE site on purpose — see the file for the dependency graph that answer
avoids keeping. There is still no `export const revalidate = <seconds>`
anywhere: nothing here goes stale on a clock, only on an edit. See trap 45
before touching `dynamicParams`.

Edits made OUTSIDE a Next request — `yarn seed`, a `payload run` script —
write the database and revalidate nothing; the hook logs a warning per
document and the live site keeps serving what it had until the next save
in the admin or the next deploy.

Three standing rules:

- **Never invent biographical facts** — name, location, employers, clients.
- **Never invent awards, metrics or credentials.** The source design shipped
  fake Awwwards/CSSDA/FWA claims and a "Numbers" column of em-dash
  placeholders. There is deliberately no `recognition` field on the
  `projects` collection, which is exactly where the reference design puts
  its award list, and `aboutMeta` is a free list of columns rather than a
  fixed `awards` field sitting empty asking to be filled.
- **Every image needs a real `alt`** describing what it shows, not
  "screenshot of the homepage". It is the only description a screen reader
  gets, and it is `required` on the Media collection rather than left to
  good intentions.

The first two are not enforceable by a schema — the third is, and was made
so. That asymmetry is the point: where a rule CAN be a field constraint, it
should be one.

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

**4. `preventDefault()` on a fragment link costs more than the jump.**
It cancels the whole navigate-to-fragment step — not just the scroll, but
the hash update *and* the focus move. `useAnchorNav` existed to put both
back, because Lenis owns scrolling (trap 3) and the jump had to be handed
to it.

**The hook is gone, and only because its last caller is.** The index was
the only page with in-page fragment links, and it has no bands to link to
any more (trap 41) — both corner marks are real routes now. Nothing on this
site calls `preventDefault` on a fragment link, so the browser does the
whole step natively, the skip link included. Write one and this trap is
live again: it is in git, and it is 47 lines.

**5. Client boundaries are leaves, not wrappers.**
There is no page-wide client boundary. The old `Shell.tsx` existed only to
run a GSAP scroll-reveal over every block; the reveals were identical at
all seven call sites, which is the universal fade-up tell. The client
leaves are `Open`, `Work`, `Corners` and `ShotStack` — each owns real
state. Do not add `'use client'` to either module's `index.tsx`.

**6. The metadata path is async now, and that is a chain of three files.**
`src/content/site.ts` must stay imports-free — it is types only, and a
single `import` of anything browser-only there breaks `next build`.

What changed with the CMS is upstream of it. The site's name, role,
description and contact address are content, so they cannot be module-scope
constants any more: `src/constants/common.ts` keeps only what is a property
of the DEPLOYMENT (`DOMAIN_URL`, the keywords, the OG image) and stays
synchronous, because `app/robots.ts` and `app/sitemap.ts` read it at module
scope. `src/constants/metadata.ts` became `buildDefaultMetadata()`, and
`app/(frontend)/layout.tsx` calls it from `generateMetadata`.

**A root layout supports `generateMetadata` exactly as a page does**, which
is the whole reason this works. The alternative was a module-scope `await`
on the server metadata path, and that is the one place in this app that
cannot have one.

**7. Palette values do not survive a change of ground — re-derive, don't nudge.**
The ground has moved three times (`#0a0a0a` → `#ececec` → `#0d1117` →
`#efedea`). Dimming pulls text *toward* the ground, so the dim that was used
for the unfocused rows of the index's work list inverted with it: 0.42
opacity on dark became a solid `--ink-3` of `#7d756d` on this paper, only
3.88:1. That list is gone (trap 41) and `--ink-3` now carries no text at
all — it is the resting underline colour and nothing else. Re-derive it
before putting type back on it.

Same reasoning gave `--well` (the empty-image field) its value.
It is *darker* than paper so it reads as a blocked-out area rather than a
wash, which is also what lets its label be `--ink` rather than `--ink-2` at
a marginal 4.03:1.

**The corner marks carry a second, derived palette** — `.st-blend`
redefines `--paper` and the three inks as `--paper` minus each, because
they paint by difference (see the a11y invariants). Change the ground or
any ink and those four numbers have to be worked out again, or the marks
stop landing on ink over paper.

**It was `#d9d5cf` at 1.25:1 and is `#c0b9ae` at 1.67:1.** 1.25 is a wash:
photographed, the portrait field on `/about` read as a smudge rather than as
a reserved rectangle, and the owner asked for the frame to be clearer. This
site has no rules, no borders and no shadows, so **the fill IS the frame**
and has to carry the whole job alone — which is why the answer was a darker
fill and not an outline. The label on it is now 9.66:1, down from 12.87 and
nowhere near a bar.

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
`var(--gut) + 2.3rem + 2.5rem` — the gutter, two lines of `.st-meta`, and
2.5rem of clearance (a paper gradient until the owner asked for it to go;
the room stayed, empty). Every sticky offset and `scroll-padding-top` is expressed against
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

Running first costs it the one thing bubbling gave for free: it cannot see
what anything downstream decided. The `url.pathname === location.pathname`
test is what keeps the curtain off a same-page fragment — today that is the
skip link and nothing else, since the index lost its own `#work` / `#about`
links with its bands (trap 41). On that path the event is left completely
alone — no `preventDefault`, no `stopPropagation` — so the browser's native
fragment step runs whole.

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

**27. A shot is shown at its own shape, and the shape arrives with the
file.**
Every shot used to be cropped to a declared `16 / 10` with `object-cover`.
The real files are nothing like it — the two on `/work/soluis` are 1.749
and 1.743 — so `cover` matched their height and threw away **8.5% of the
width**, 4.3% off each side. On a screenshot that is not a neutral crop:
the edges are where the layout being shown off actually is, and both of
those images lost part of a right-hand column. Measured before: both
932.3x582.7, ratio 1.6000. After: 932.3x533.3 and 932.3x534.5, at 1.7483
and 1.7442 — the files' own shapes, at every width from 320 up.

Three things that decides, and one it does not:

- **The ratio has to be known before the image arrives, so it is recorded
  at upload.** `ShotStack` places the rail's marker from where each shot's
  centre falls (trap 25), so a column that grew as each file landed would
  move every one of those centres under the reader. `width`/`height` on the
  `<img>` are the intrinsic pixels — not a rendered size, but the
  reservation — and they come off the Media document, which Payload fills
  in with `sharp` the moment the file is uploaded. Verified by holding
  `/_next/image` for 2.5s: the boxes stood at 533.02 and 534.91 before a
  byte arrived and at 533.28 and 534.52 after — **0.26px and -0.39px**, one
  pixel of document height across the whole page. That residue is the
  optimizer rounding a resize to whole pixels, and `object-fit: fill`
  absorbs it. Re-verified against the CMS at 1440: 1.7487 and 1.7430 from
  intrinsics of 3012x1722 and 3017x1731.
- **This used to be a build-time `sharp` read of `public/<src>`, in
  `src/utils/imageSize.ts`, and that file is gone.** Not because it was
  wrong — it was correct and measured — but because the dimension is now
  known by whoever holds the file, which is strictly earlier and one fewer
  thing to keep in step. It also removed an assumption nobody had noticed
  making: that every image is a path under `public/`, which stops being
  true the first time uploads move to S3 or Vercel Blob. A hand-typed
  height in the content was rejected for the same reason it always was — it
  goes stale the first time an image is re-exported.
- **`tall` now shapes the EMPTY field and nothing else.** There is nothing
  to measure on a field with no image in it, so it still needs a declared
  ratio, and `tall` still breaks the rhythm of a stack of them. Verified on
  a project with one of each: thumbnail ratios 1.738, 1.683 (measured) and
  1.600 (declared) in one rail.
- **A slot keeps its crop, and that is not an inconsistency.** The ring's
  covers are a designed box that has to hold still whatever is dropped in:
  its shape is one number by construction (trap 26), and covers of eight
  different heights would not be a ring. `Shot` takes `ratio` for that and
  `size` for a shot shown at its own proportions — which one is right is a
  property of the place, not of the image. (The index's preview aside was
  the other `ratio` call site, and it went with the work list, trap 41.)

  **`/about`'s portrait is the second slot, and its shape is not even a
  number.** `Shot`'s `stretch` makes the box fill a height set from outside
  — there, the prose column beside it — so `size` is ignored and a real
  photograph is cropped in with `object-cover`. A column measured against
  its neighbour is a place, which is the test this bullet already states.
  Worth knowing before uploading: that portrait WILL be cropped, and the
  crop is centred.

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
  diacritics will move those numbers — re-read them after changing the name
  in the Profile global, the way the computed font-size has to be re-read
  at 320.

  **That used to be a code change and is now a text field in `/admin`**,
  which makes it the one place the CMS genuinely loosened a guarantee: the
  headroom above is a measurement of `Max Huynh` at Nippo's metrics, and
  nothing stops someone typing a name with a deeper descender into a form.
  It fails visibly rather than silently — the mask shaves the tail — but it
  fails without anyone running a build.
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
*(Also found in the removed work list, trap 41 — and kept for a stronger
reason than trap 30: this is the THIRD time the repo learned it, and the
two survivors, the ring's readout and the thumbnail rail's marker, are
still built on it.)*
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
*(The component this was found in — the index's work list — has been
removed, trap 41. The lesson is kept because it is about React and about
photographing a gesture, neither of which went anywhere.)*
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
scroll reset the visible ones are the corner marks, a project page's
thumbnail rail and the readout's `/ 08` — which no longer simply appears;
see trap 44.

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

**37. Payload needs this package to be ESM, and two bundlers have to agree
about one import.**
`package.json` carries `"type": "module"`. That is not a preference; the
`payload` CLI transpiles the config with its own bundled tsx, and in CJS
mode tsx registers a `.js` transformer but never hooks resolution, so
`./src/payload/collections/Media` and `./…/Media.js` both fail with
MODULE_NOT_FOUND. Before that it failed earlier still, on
`ERR_REQUIRE_ASYNC_MODULE` from `@payloadcms/richtext-lexical`'s top-level
await. The repo converted cleanly because there was nothing to convert:
`postcss.config.mjs` was already explicit and there is no `.js` or `.cjs`
anywhere in `src` or `app`.

- **The config's own imports are extensionless, and both halves had to be
  tried to find that out.** With `.js` the Payload CLI is happy and
  Turbopack is not — `next build` fails on all five with "Can't resolve
  './src/payload/globals/SiteSettings.js'", because `moduleResolution:
  bundler` does not rewrite `.js` to `.ts`. Extensionless satisfies both.
  A change here that is only checked with `yarn generate:types` is a change
  that has been tested on one of the two bundlers that have to load it.
- **`lexicalEditor` is not configured, and that is a decision.** `editor`
  is optional in the config type, no field here is `richText`, and the
  three textareas are read by `Lines`, which measures PLAIN text — a rich
  text field would hand it markup to break on.
- **`withPayload` goes outermost in `next.config.ts`**, around the PWA
  wrapper rather than inside it, so the admin's server-only packages are
  externalised after the plugin has finished rewriting the config.
- **Two root layouts, no `app/layout.tsx`.** `app/(frontend)` and
  `app/(payload)` each render their own `<html>`, which Next supports as
  long as the home route lives inside one of the groups — it does. The cost
  is that moving between the site and `/admin` is a full page load, which
  is the right answer anyway: the admin has no business inheriting the
  preloader, Lenis or the route curtain.
- **The seed creates no user.** Payload serves its own create-first-user
  screen at `/admin` against an empty `users` collection, and that is where
  the password belongs. A credential invented by the script that seeds the
  database is not a credential.
- **The seed refuses a database that already has content** unless
  `SEED_RESET=1` is set, and says what it found. A fixture that silently
  overwrites is a fixture that eventually overwrites the real thing.

  **An env var and not a flag, because `payload run` empties `process.argv`
  entirely** — it strips the script path as well as everything after it, so
  `process.argv.includes('--reset')` can never be true. This shipped as a
  flag, and was written up here as the way out, without the way out ever
  having been run: the refusal path was tested and the escape from it was
  not. `yarn seed:reset` is the script that sets it.

**38. An empty-looking hero was not short of content. It was short of
balance.**
The complaint was that the opening read as too empty, and the fix people
reach for is more content. Measured first instead, at 1440x900: the fitted
masthead runs edge to edge and ends on the RIGHT margin, and the intro under
it carried `md:ml-auto` — so both of the screen's heavy objects finished
against the same edge and the lower left was a dead rectangle **810x228**,
and **1195x187** at 1920. Two objects, one edge.

So contact came up out of the foot of the page and took that quarter. The
register below the masthead is a left/right pair now, which is the grammar
the rest of the site already speaks — the corner marks are a left/right pair
at every edge of the viewport. The address anchors under the START of the
name and the intro stays under its END, where the eye already finishes.

- **The `<h1>` is a DIRECT CHILD of the section and has to stay one.**
  `useFittedText` solves against its container's content box (trap 8), so a
  wrapper between the two would hand the fit a width that is not the
  column's. Everything added is a sibling. Verified: `--fit-size` is 247px
  at 1440 before and after, and the preloader's handover is **bit-identical**
  — `dTop` 0, `dLeft` 0, `dHeight` 0 at 320, 768, 1440 and 1920, with
  `h1.innerHTML` still exactly `Max Huynh` on the load path. The heading's
  screen POSITION moved (270 → 206 at 1440, because more content below it
  changes where `justify-center` puts it) and that costs nothing: the stage
  re-reads the heading every frame rather than once, so the landing is true
  by construction (trap 10).
- **`getClientRects()` counts line boxes on an INLINE element and not on a
  BLOCK one**, and the a11y sweep for two-line clickables was built on the
  inline case. `.st-line-body` is `display: block`, so the address returned
  ONE rect covering both of its lines and the sweep reported a clean zero at
  every width. It was wrapping at 320. A `Range` over the element's own text
  node reports one rect per line box either way — that is the measurement,
  and it found the wrap immediately. **The old foot-of-page Contact wrapped
  there too** (1.9rem, 398px of ink in a 270px column), so this was an
  inherited bug that a wrong probe had been hiding, not a new one.
- **The clamp floor on the address is set by the narrowest column it has to
  survive, not by taste.** An address is one word to a line-breaker: it fits
  or it becomes a two-line link. At 320 the column is 270.5px and the string
  measured 272.2px at 1.3rem — short by **1.7px**. 1.15rem measures 240.8px,
  leaving 29.7px. Re-read that if the address ever gets longer; it is the
  same fragility the masthead has, and for the same reason.
- **The address is NOT repeated here** — it lives in the corner mark and
  nowhere else on the screen. The first build of this put it in both, argued
  that the corner was chrome and the opening was content, and the owner read
  it as what it was: the same address twice, 400px apart. What the opening
  carries instead is the set of places the work lives, which the corner does
  not carry at all.
- **The contact links are brand marks, and the set forced the library.**
  Simple Icons is the better source in principle — the brands' own artwork,
  one solid path each — and it has github, facebook, instagram and x. It has
  neither **linkedin nor codepen**: both brands asked to be removed from it.
  Four marks and two words is not a row. Lucide is already a dependency and
  has something under all six names, which is the trap: its brand icons are
  deprecated outline glyphs, its `twitter` is still the bird, and its **`x`
  is the close cross** — it would have drawn a dismiss button beside a link
  to x.com. Font Awesome 6 Brands carried all six in one weight including
  the real X, and shipped for a while; tree-shaking was measured, not
  assumed, at **+6,851 bytes** of client JS for the six rather than the
  whole pack.
- **They are Tabler now, and the LICENCE is the reason.** Font Awesome Free
  is **CC BY 4.0** — the `react-icons` wrapper is MIT, the artwork is not —
  so the attribution had to ship to a reader, and the only place it could
  live was the colophon at the foot of `/about`. The owner asked for that
  line to go. An attribution is not a line you can quietly drop, so the
  OBLIGATION went instead: `react-icons/tb` is MIT, carries every brand
  here, and needs no notice anywhere. Nothing on this site requires one now.

  The trade is real: these are OUTLINE marks drawn with a stroke where Font
  Awesome's were solid — lighter on the page, and at 1.25rem beside 0.95rem
  text they read as quieter rather than smaller. `TbBrandX` is the real X
  mark and not a close cross, which is the one thing that had to be checked
  before trusting a second outline set after Lucide.
- **An unknown label gets no mark, and falls back to its own text.** The
  links come from the CMS, where anyone can add a row called anything. A map
  that guessed would render a link with nothing in it.
- **One group, and the merge happened in the CMS rather than in the view.**
  The links were two columns, `code` and `elsewhere`, and that split earned
  its place while they were words in two lists. As six marks in one row the
  labels outnumbered what they named: a hardcoded `contact` heading over a
  group called `social`, one line apart, naming the same six links twice.
  They are one column called `social` now — merged in `site-settings`, not
  flattened in the component, because the grouping is content and a view
  that disagreed with the admin would make the admin a lie.
- **The first group's label IS the region's heading.** There is no separate
  hardcoded word any more: `links[0].label` renders as the `<h2>` that
  `aria-labelledby` points at, and a second group would render under it with
  a `<p>` of its own. `#contact` is still on the section, so a link written
  elsewhere still lands here.

  **The corner nav lost its `contact` mark**, and the vocabulary is the
  reason. It stopped earning its place in two steps: contact moved up into
  the opening, so the link scrolled the reader back toward the top of the
  page they had just started on; then the address left the block for the
  corner above it, and what the mark reached was a row of social links
  named `social`. A mark that says one word and arrives somewhere named
  another is worse than no mark. **Two marks now** (three since
  `experience` joined them) — `work` and `about`,
  and both are real routes. The third went when the index's work list did
  (trap 41): it pointed at `/#work`, and what it named stopped existing.
  `all work` became simply `work` at the same time, for the same vocabulary
  reason this bullet is about — `all` was a comparison with the shortlist
  on the index, and there is no shortlist. The `#contact` id stays on the
  block: nothing points at it, but it is a stable anchor for a link written
  elsewhere, and an id costs nothing.
- **Hover and focus on an icon are carried by ink, not by an underline.**
  The site's rule is an underline, and an underline under a 24px glyph reads
  as a stray rule. `--ink-2` to `--ink` on the same `--t-quick` is the same
  idea in the same palette — no new colour, no new duration. Resting 5.05:1,
  past the 3:1 WCAG asks of a graphic that carries meaning, which this one
  does because it is the link's only visible content.
- **The mark's box is bigger than the mark.** 2.25rem against 1.25rem keeps
  every target past the 24px minimum at every width the fluid root resolves
  to — measured 33.8px at 320 and 40.3px at 1920 — and the row is pulled
  back by exactly that padding so the first mark's ink still starts on the
  column's left edge. Verified at 0.00px against the label above it, at five
  widths.
- **`.st-icon-row` must not be given Tailwind's `m-0`, and that is trap 1
  read backwards.** Both rules are layered; utilities come after components,
  so the utility wins. The first version shipped with `m-0` beside the
  primitive and the row sat **7.5px inside the margin at every width** — the
  pull-back was in the stylesheet, computing correctly, and losing.
- **The intro is first in the DOM and second on screen.** The two can
  disagree here at no cost because a paragraph holds no focus: every tab stop
  on the screen is inside the contact block and they are in order. What the
  DOM order buys is the reading sequence — name, what the work is, how to
  reach him.
- **The colophon did not come up with contact.** It is not contact; it is an
  account of how the page was made, and that belongs at the end of a
  document. It is its own quiet band now, in `Colophon.tsx`.

Verified at 320 / 375 / 414 / 600 / 768 / 900 / 1024 / 1280 / 1440 / 1920:
no clickable on two lines, no horizontal overflow, and the opening is
exactly one viewport tall at every one of them — the tightest clearance
between the content and the fixed bottom marks is **37.4px at 320x568**, the
same viewport that is already the site's known floor. 13 masked rows in the
opening, **all 13** moving, first at +57ms after the panel clears and last at
882ms, ~50ms apart against the 52ms step. Under `reduce`, **4** distinct
positions per row against **76** with ordinary motion. Contrast sweep over
the opening: zero failures at 320, with the control confirming the sweep can
still fail (0 → 1 → 0).

Re-verified after the marks replaced the words and the two groups became
one: six links, whose accessible names are still GitHub, CodePen, LinkedIn,
Facebook, X and Instagram, in that tab order; **one** visible label at every
width and all six marks on **one line**, including 320; the first mark's ink
on the label's own left edge to **0.00px** at five widths; **10** masked rows
all moving, the first at +57ms and the last at 724ms; and under
`prefers-reduced-motion` **4** distinct positions per row against 76 with
ordinary motion. Icon rest colour 5.05:1, hover and focus 16.09:1, focus ring
2px at 3px offset from the global rule. The `#contact` mark still lands: it
scrolls 417px, stops 16.1px clear of the chrome, moves focus to the region,
and leaves the masthead in view.

**39. A band can be quiet. A page cannot.**
About was the quietest thing on the index — one paragraph and two short
lists — and it could afford to be, because the work list above it was doing
the talking. Lifted out to `/about` it had to carry itself, and one
paragraph does not.

- **The grammar is the project page's, on purpose.** A narrow column of
  metadata, the content, and a narrow column of picture is exactly what
  `/work/<slug>` already sets up. Reusing it is what makes `/about` read as
  another page of this site rather than a second template; what changes is
  what fills the three columns — prose instead of shots, a portrait instead
  of a rail of thumbnails. The first build had only TWO columns and left
  roughly **600px of the right third empty at 1440**, which is the same
  fault the opening had before contact came up into it (trap 38).
- **`.st-statement` masks display type that BREAKS.** `.st-mast` masks one
  fitted line that never wraps; a sentence wraps, and `Lines` is the only
  thing here that knows where. So the geometry is `.st-mast`'s — clip pushed
  out with padding, space taken straight back with a negative margin — but
  applied by DESCENDING into `.st-line`, because `Lines` writes that class
  itself and a call site cannot add to it.

  **The parked pose has to out-specify the released one.** `.st-statement
  .st-line-body` and `[data-in="true"] .st-line-body` are both two
  class-level selectors, and the later of two equals wins — park it after
  the release rule and the type never arrives. `.st-statement[data-in]` is
  three, which settles it. Verified: real ink headroom inside every line
  box is positive at every width, tightest **4.9px at 320**, 15.4px at 1920.
- **`.st-wash` on a bare `<div>` is permanent invisibility, not a fade.**
  The class is `opacity: 0` until something sets `data-in` on it, and only
  `Reveal` does. It shipped here for a few minutes as a plain div and the
  portrait field simply never painted — while every measurement of it (rect,
  size, label text) came back correct, because the element was there and
  laid out. **If an element measures right and cannot be seen, check what is
  supposed to be turning it on.**
- **The statement IS the `<h1>`; it is not wrapped in one.** `Lines` takes
  an `as` prop and it grew an `'h1'` option for this. Wrapping put a `<p>`
  inside an `<h1>` — `h1` takes phrasing content and `p` is flow content —
  which every browser keeps, which produces the right accessible name, and
  which is invalid all the same. It shipped that way until an independent
  pass read the SSR output rather than the rendered page.
- **`.st-statement .st-line` needs `pointer-events: none`, for the reason
  `.st-mast` does.** At this size the extended clip is taller than the gap
  between lines: measured at 1440, a **104.93px clip around a 72.65px line
  box**, so each mask overlaps its neighbour by **16.14px** and the later of
  two would take the hits for both. It cost nothing while the only thing
  under the last line's overhang was `<main>`; it costs the moment anything
  clickable is set below the statement. The line takes its own hits back
  with `pointer-events: auto`, so the type stays selectable.
- **Any change of viewport width replays every reveal on the page.** A
  `Lines` re-split sets the block back to plain, which parks it, which makes
  it rise again (trap 32). Measured deliberately: resizing 1440 → 1100 at
  rest re-parks **17 of 27** masked bodies, flips `data-in` true → false →
  true within 8ms, and leaves something parked across **176 frames, 16ms to
  1474ms**, before settling correctly. It is not new and it is not wrong —
  it is what re-measuring costs — but `/about` is where it shows most,
  because every reveal there is `on="load"` and above the fold.

  **Which is why a `fullPage` screenshot of this site is not evidence.**
  Playwright's full-page capture changes the viewport to stitch the image,
  so it photographs a page mid-reset with paragraphs missing. That happened
  here and read exactly like a bug. **Photograph this site at a fixed
  viewport and scroll it yourself.**
- **`innerText` inserts a line break between block-level split lines, and a
  regex across one will fail.** Testing the colophon for its Font Awesome
  attribution at 320 returned false, because the split put "Brand marks are
  Font " and "Awesome Free, CC BY 4.0." in separate blocks. The text is
  intact — each line keeps its own trailing space, so a screen reader reads
  it correctly (trap 23) — and `textContent` with whitespace squashed finds
  it at every width. **Squash whitespace before matching any string that
  `Lines` has been through.**

**What the genre actually does**, from reading seven well-regarded personal
and studio about pages rather than guessing:

- **The portrait is never a hero.** Not one of the seven opened on a
  full-bleed face. Where a portrait exists it is inline punctuation (a 129px
  square), a column beside the heading (324x486), or a background image in a
  column (586x830). **Three of the seven have no portrait at all and lose
  nothing** — which is what makes shipping this page with a labelled field
  a real state rather than a gap waiting to be filled.
- **Scale splits cleanly.** Largest type over body text runs **2.3–3.1x on
  pages that read as a person** and 5–10x on pages that read as a sales
  deck. This page is **3.75x** (81px over 21.6px at 1440), deliberately at
  the top of that band rather than inside it: this site's own masthead is
  11.4x, so a statement at a third of the masthead is the restrained choice
  here even though it is the loud one elsewhere.
- **Length correlated INVERSELY with how much a page read as a person.** The
  14-screen one was a sales page whose about URL redirected to the homepage;
  the four-screen one said more. **This page is now exactly one screen and
  is not allowed to grow** (trap 43) — not by adding sections, and not by
  adding prose either: the fit is a property of how much is written, and the
  budget is recorded there.
- **Every anti-pattern the sample threw up is already banned here**, which
  was worth confirming rather than assuming: award badge rows, round-number
  combined-experience claims, `01/02/03` over things that are not a
  sequence, team headshots, a small tracked label above every section, and
  partial monospace. **Not one of the seven had a metrics row.**

**There is deliberately no closing call to action**, and that is a stated
deviation rather than an oversight: the genre's commonest shape closes on an
invitation set at the opening's size, and this site puts the address in the
corner mark on every page. A second copy at the foot of `/about` is the same
mistake the opening made with the email and had to have taken back out.

**The two images in `public/images` are template stock and neither may be
used here.** One is an AI-generated office interior; the other is a
photograph of a stranger. Dropping either in would be a claim about what the
owner looks like, which is the same rule that forbids inventing where he
lives or who he has worked for.

**The colophon was at the foot of this page, and it is gone — but only
because the thing holding it here went first.** It arrived by being
redundant somewhere else: a band under the index's work list, where an
account of the typefaces reads as something left over from a longer page.
Beside an account of who built the site it read as the end of that account.

This file used to say it **could not simply be deleted**, and that was
correct: the Font Awesome attribution lived in it, and Font Awesome Free is
CC BY 4.0. It named two ways out — move the attribution somewhere it still
ships to a reader, or switch the marks to Tabler. When the owner asked for
the line to go, **the second one was taken**: the marks are MIT now (trap
38), nothing on this site owes anyone a notice, and the colophon could be
removed rather than relocated.

It was removed whole — the `<footer>`, the prop, the `SiteSettings` field,
the shape in `site.ts`, the read in `source.ts` and the seeded string. A CMS
field nothing renders is worse than no field: an editor fills it and waits
for it to appear.

Verified independently at 320 / 375 / 414 / 768 / 1024 / 1440 / 1920: no
horizontal overflow and nothing past the viewport edge; **no clickable on
two line boxes** (counted with a Range, not `getClientRects().length`); the
statement's real ink has positive headroom in every line box at every width,
tightest **4.95px at 320**; **0 of 27** masked bodies left parked and the
wash at opacity 1; **0** contrast failures with the control confirming the
sweep can still fail (forcing the label to `--ink-3` gave exactly 1 at
3.88:1, restoring gave 0); and **0** of the eight banned pattern classes
anywhere in `#content`.

On the route path, 642 sampled frames: **22 of 23 masked items travel**, up
to 151 distinct transforms each, and the twenty-third is `.st-wash`, which
is an opacity fade with no transform and moves through 92 distinct
opacities. Median frame 8ms, **zero frames over 20ms**. Under `reduce`, at
most **4** distinct positions per element against 151 — it arrives, it does
not travel.

The clip was also checked by photograph rather than by arithmetic: the
`<h1>` rendered as shipped and again with `overflow: visible` forced on the
line masks is **byte-identical at all seven widths**, and a pixel scan finds
no ink touching the top or bottom edge of the heading box. (Deriving the
baseline from canvas `fontBoundingBoxAscent` instead reports −3.3 to −9.05px
— that model is wrong against a `line-height: 0.9` box, which is trap 36's
lesson arriving a second time.)

**40. Uploads live on Cloudinary, and the app's filesystem is not a place
to put them.**
They were under `public/media`, which worked and could not deploy: a
serverless filesystem is thrown away at the end of the request, so every
image uploaded in production would have been gone before anyone asked for
it. The four seeded files were only ever there because the seed puts them
there on the way past.

- **The adapter is hand-written, and the alternatives were checked first.**
  Payload ships first-party adapters for S3, Vercel Blob, Azure, GCS and
  UploadThing, and none for Cloudinary. The community `payload-cloudinary`
  package is **Payload 2 only** — its peer range is `^2.0.0`, so it cannot
  load here at all. `@payloadcms/plugin-cloud-storage` is the supported
  extension point; `src/payload/cloudinary.ts` implements its `Adapter`
  contract against the official SDK.
- **The URL is STORED, not reconstructed.** The obvious implementation
  rebuilds the URL from a public id on every read, and it breaks the moment
  Cloudinary normalises a format: upload `a.jpeg`, it stores `a.jpg`, and a
  reconstructed `.jpeg` URL 404s. `handleUpload` writes the `secure_url`
  Cloudinary actually returned onto the document — version segment and all —
  and `generateURL` hands it straight back. The public id is stored beside
  it because a delete has to address the exact object.
- **`src/content/source.ts` reads that URL and derives nothing.** `pathOf`
  used to build `/media/<filename>`, which was right while the files were on
  disk and is exactly the second guess that a change of storage invalidates.
- **`disablePayloadAccessControl` is what makes it one hop.** Without it,
  every image would be proxied through `/api/media/file/*` — a Node process
  in front of a CDN. With it, `doc.url` is the Cloudinary address, which is
  why `next.config.ts` has to name `res.cloudinary.com` as a remote pattern.
  That pattern is **scoped to this cloud's own path**: a bare hostname would
  let the image optimizer be pointed at any account on the service.
- **`sharp` still runs first, so trap 27 is untouched.** Payload reads width
  and height off the buffer before the storage adapter sees it, so a shot is
  still laid out at its own proportions before a byte is fetched. Verified
  across the move: `/work/soluis` renders at **1.7483 and 1.7442**, the same
  two numbers trap 27 recorded when the files were local, from intrinsics of
  3012x1722 and 3017x1731.
- **One secret, in `CLOUDINARY_URL`.** The SDK reads that variable by itself
  and derives the cloud name, key and secret from it. The loose
  `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` pair that was in `.env`
  alongside it is gone: two copies of one secret in one file is a drift
  waiting to happen, and the SDK was only reading one of them anyway.

Verified after the move: all four media documents carry full Cloudinary URLs
with their version segments, the index's covers and both project shots fetch
through `/_next/image` from `res.cloudinary.com`, every image decodes, and
there are **zero failed requests**. Nothing new was written to
`public/media` — the directory held only the four files from the previous
local run, dated hours earlier, and has been deleted.

**41. One screen with no scroll is a promise about the CONTENT, not a rule
about the height.**
The index is now the opening and nothing else. What made it one screen was
deleting the work list under it — the opening was already `min-h-[100svh]`
and already fitted inside one, at every width. Nothing about the hero's own
height had to change, and the measurement is what said so rather than a
guess.

- **`min-h`, and not `h`.** A fixed height with content that outgrows it
  either clips or overflows, and both fail silently — the reader gets a
  page that is quietly missing a line. `min-h` grows, the page scrolls, and
  the failure is the visible one. The promise is kept by the content having
  room to spare, not by a rule forbidding it to need any.
- **`svh`, not `vh` and not `dvh`.** `100svh` is the viewport with the
  mobile browser's chrome fully EXPANDED, which makes it the only one of
  the three that can never exceed the visual viewport and so the only one
  that can never produce a scrollbar of its own. `dvh` would be correct at
  rest and wrong for the moment the chrome is retracting.
- **The padding is not slack, and tightening it is invisible until it
  breaks.** `clamp(7rem, 13vh, 9.5rem)` top and bottom is sized by the
  fixed corner marks: at 320x568 the floor resolves to 105px against a top
  chrome of 89.25px, which is **15.75px** of margin. And because it is
  SYMMETRIC under `justify-center`, it has no effect at all on where
  anything sits — the content is centred on the viewport either way. All it
  decides is the width at which the page starts to scroll, so a change here
  looks like nothing until it puts the masthead under the corner marks.
- **The headroom is the number to watch, and it is the CMS that spends
  it.** Content occupies 185px of a 358px box at 320x568 and 431px of 776px
  at 1920x1080 — 173 to 345px in hand. `profile.intro` is a textarea in
  `/admin`, so a long enough intro re-introduces the scroll without anyone
  running a build. Same shape of exposure as the masthead's headroom in
  trap 29, and it fails the same visible way.
- **Three things were deleted with the list, none of them optional.**
  `.st-cover` / `.st-cover-stack` had one consumer; `useAnchorNav` had one
  caller and it was the `#work` mark (trap 4); `src/constants/router.ts`
  was already dead and its `#work` entry had become a lie.

Verified at 320x568 / 375x667 / 414x896 / 600x800 / 768x1024 / 900x700 /
1024x768 / 1280x800 / 1366x768 / 1440x800 / 1440x900 / 1920x1080:
`scrollHeight - clientHeight` is **0** at every one, the section's height
equals the document's equals the viewport's, and `window.scrollBy(0, 400)`
leaves `scrollY` at **0**. No horizontal scroll (−15 everywhere, which is
`scrollbar-gutter: stable` reserving a gutter the page never needs), no
clickable on two line boxes counted with a Range, and the `work` mark still
lands on `/works`.

**What this leaves is a sparse page, and that is a real thing to look at
rather than a defect to hunt.** Photographed at a fixed viewport: 140–354px
of empty paper above the content and 157–371px below it, worst on tall
phones where the masthead is width-bound. The three answers are centre it
(what it does now), anchor the register to the foot of the screen so the
two objects span it the way the corner marks do, or let the type grow. It
is a composition decision and it has not been taken.

**42. A transform on an inline element does nothing, and every measurement
of it will still look right.**
The route curtain's destination name is split into one character per clipped
mask so the word rises rather than fades. The split shipped, GSAP wrote a
transform onto every letter on every frame, `getComputedStyle` read that
transform back correctly — and the word sat perfectly still. CSS transforms
do not apply to non-replaced INLINE elements, and with `.st-curtain-letter`
missing its `display: block` the spans were inline.

**And the reason it was missing is the one this file already tells you to
check first.** The dev server was serving a stale `global.css`: the new
rules were in the source and not in the chunk. It was caught by
`curl`-ing the built stylesheet and finding **zero** occurrences of
`st-curtain-word` in a file that had two of `st-display` — trap 17, and the
tell was there earlier and was misread. Two runs of the same measurement
disagreed, one showing the letters travelling through 90 distinct
transforms and one showing a single position. **Two identical runs
disagreeing is a stale bundle until proven otherwise; it is not a race in
your own code.** Restart the server before forming any other hypothesis.

Six things the split itself decided:

- **The line-height is a call-site UTILITY, not a rule on the primitive.**
  `.st-display` sets 0.9, tighter than Nippo's ascent plus descent, so the
  glyphs hang outside their own box and a mask cut to that box shaves them.
  `leading-[normal]` is the face's own 1.269em box, so nothing can reach the
  clip and no number here tracks the font (trap 26). It is a utility because
  `.st-curtain-word` and `.st-display` sit on the same element at the same
  specificity, where the later rule in the file wins — and "whichever we
  wrote second" is not a thing to hang a clipped mask on. Trap 39 records
  that exact fragility costing a whole page its type.
- **The split is allowed to be naive here, and trap 10 is why that needs
  saying.** One box per character loses the kerning pairs, and the preloader
  had to solve that with a hidden unsplit copy and a Range per character
  because it lands on the real masthead to the pixel. This word lands on
  nothing, it is set in CAPS — far fewer critical pairs than lowercase — and
  the positive tracking has already separated them. The total advance
  survives a split regardless; only the pairs do not.
- **The stagger starts where the cover ENDS, and that was a correction.**
  `LETTER_LEAD` is a fraction of the cover and it is 1. At 0.2 the letters
  rose inside a panel that was itself still rising, so against the screen
  they moved at panel speed plus their own and the word arrived at the same
  instant its ground did — which reads as one event, not two. The owner
  called it immediately: the curtain shuts, THEN the name comes up out of
  it. It is also what the preloader does, the paper being there before the
  letters land on it. **The cost is the whole stagger, added to the
  transition rather than hidden inside the cover, and it is not recoverable
  by tuning** — 1810ms against 1407ms. `LETTER_RISE_MS` and
  `LETTER_STEP_MS` are the knobs if that ever has to come down.
- **EVERY internal `Link` needs `data-transition-label`, and one did not.**
  The curtain spells that attribute out; a Link without one raises a panel
  with nothing on it. The masthead mark in the top-left corner — the one
  that goes home — was the single exception in the app, so every navigation
  BACK to the index opened a blank black screen. The ring's covers, the
  list's rows, the next-project link and the two bottom marks all carried
  one, which is exactly why it went unnoticed: the missing one is the link
  that looks least like navigation.

  It also cost the `role="status"` line, which announced a bare `Loading`
  instead of naming the destination — the same bug, in the half nobody
  looks at.

  The word is **the name**, and it is the SAME string the mark shows —
  built once in `Corners` and handed to both, the way `MainLayout` already
  builds it once for the preloader's handover. It was `index` for one round,
  on the argument that the preloader already spells that exact name onto
  that exact masthead and a route change repeating it might read as a
  reload. The owner asked for the name; it is also what `/`'s own `<h1>`
  says, and the rule this file keeps is that a mark arrives somewhere named
  what it said.

  **A word space is not a masked letter**, but the character still goes into
  the DOM. It gets a sized spacer with no clip and no place in the stagger —
  and `splitInto` puts the space itself inside it, because a spacer that is
  only a width reads back as `MaxHuynh`. That is trap 23's "I build it
  tohold up." in another costume; it costs nothing while the panel is
  aria-hidden and would cost the moment that changed.
- **An empty word must not be waited for.** `nameRestAt` was computed from
  the lead and the rise whatever the letter count, so a labelless navigation
  held for the full stagger with nothing to show: measured at **708ms** of a
  reader sitting behind a blank panel. Fixed by returning 0 for an empty
  split. Every Link carries a label now, so it should be unreachable — which
  is how the 708ms got there in the first place.
- **`covered` hangs off the PANEL's tween, not the timeline's.** The
  timeline outlives the panel by the tail of the stagger, and hanging the
  route push off the whole thing would hold the fetch behind an animation
  the route has nothing to do with. The push still happens the instant the
  panel is shut.
- **There is a minimum hold, and it is derived rather than chosen.**
  `nameRestAt` is computed at `go` from the lead, the step and the rise, and
  `reveal` defers until `NAME_HELD_MS` past it. Without it a prefetched
  route arrives while the letters are still coming up and the first of them
  begins leaving before the last has landed — which does not read as a
  stagger, it reads as a glitch. The 3s cap is armed underneath the whole
  time, so this cannot become an open-ended wait.
- **The CAPS are a `text-transform`, never the string.** `data-transition-label`
  and the `role="status"` line both still carry the word as it was written,
  verified reading `Loading about` while the panel showed `ABOUT`. Uppercasing
  in JS would have handed a screen reader a string some of them spell out.
- **The word measures 7.5px left of `innerWidth`'s centre at every width,
  and that is correct.** The panel is `inset-0`, which is the page box;
  `innerWidth` includes the 15px `scrollbar-gutter: stable` reserves. Half a
  gutter is exactly the difference. Centring against `innerWidth` instead
  would put the word off-centre on what the reader actually sees. Trap 16
  is the same measurement mistake in its other costume.

Verified from `/` at 1440x900, from `/` at 320x568 and from a project page
at 768: **87–89 distinct positions per letter** (against 1 when it was
inline), **zero frames in which any letter or the panel travelled back the
way it came**, median frame **8.3ms** and **0 frames over 20ms** across
169–219 frames.

The sequence itself is measured rather than eyeballed, by counting frames in
which a letter has left its park while the panel is still short of the top:
**0**, at both widths. The panel reads as closed at 435ms and the first
letter moves at 486ms — the 51ms is `power3.inOut` decelerating through its
last half-pixel, not a gap in the timeline. The letters then land 769 / 810 /
852 / 885 / 927ms, the 40ms step intact. Real ink
headroom inside every mask is positive and symmetric: **18.19px** at 1440,
**6.66px** at 320. Under `reduce` the letters are built and take exactly
**one** transform — assembled, never assembling, the same call the preloader
makes. Three navigations in a row each cleared `data-routing`, landed at
scrollY 0, emptied the word out of the DOM and left focus on `#content`.

**It costs about 650ms, and now it varies with the word.** A fixed 40ms step
means a longer name is a longer transition: **1766ms** for `work` (4
letters), 1925ms for `Max Huynh` (8), and **2098ms** for `Project Eight`
(12) — the longest label the seed can produce. If that ceiling ever needs
holding down, cap the TOTAL stagger and let the step tighten for long names
rather than adding the difference to every navigation. It is untouched for
now because a fixed step is this repo's idiom everywhere else — the
preloader's 70ms, the spec sheet's 50ms, the list's 38ms.

The curtain runs 1766–2098ms against roughly 1150
before: ~250ms for a stagger that is actually seen, and ~400ms more for
showing it after the cover instead of during it. All of it is spent in the
hold rather than on the network, and it is the same length as the preloader
— which the owner accepted for a page LOAD, a rarer event than a click.

**43. Fitting a page to one screen is a subtraction problem, and the first
thing to subtract is whatever says the same thing twice.**
`/about` was 1.33 screens at 1440x900 and **2.43 at 320x568**, measured
before anything was touched. Squeezing the type was never going to close
that, and it would have paid for the fit with the thing being bought. Four
things went instead, none of them content:

- **The `about` eyebrow.** A small label reading `about`, directly above an
  `<h1>`, on a page reached by a corner mark that says `about`, from behind
  a curtain that spells ABOUT across the entire screen on the way in. Four
  sayings of one word, and the only one that could be removed at no cost.
  46px.
- **The portrait's mobile size.** Full width at 4:5 it was 338–456px tall —
  **over 60% of a 320x568 screen** for a field with no photograph in it. It
  is a small fixed column beside the metadata now, which is the size the
  genre actually uses: trap 39's research found a 129px square doing this
  job on a page that reads as a person, and three of seven pages with no
  portrait at all. Stacked, those two blocks cost 556px of a 395px budget.
- **The air between the bands.** 81px above the columns and 108px above the
  foot at 1440, both sized when the page could be any length it liked.
- **A line off the statement**, by taking its measure from 18ch to 26ch —
  three lines to two, ~94px, **without touching the type scale**. The
  measure is the knob on a display statement; the size is the point of it.

**And then the portrait was asked to be bigger, and bottom-aligned with the
last line of the prose.** Widening it at a fixed 4:5 cannot do that, and the
reason is a feedback loop: a wider portrait narrows the prose, a narrower
prose is taller, and a taller prose moves the line you were aiming at. At
768 there were only 111px of free width to spend and the target was 224.

So the height comes from the row instead. `md:items-stretch` makes the
portrait exactly as tall as the tallest column, which is the prose, whose
last line is `open to work`. Measured: the two bottom edges are apart by
**0.00px** at 768, 1024, 1280, 1366, 1440 and 1920 — by construction, and it
stays true when a paragraph is added. The frame went from 202x252 to
**228x293** at 1440 and from 233x291 to **269x341** at 1920.

- **No `h-full` on a stretched flex item**, and this one cost a full pass.
  `height: 100%` resolves against the parent's height, the row's height is
  `auto`, and an auto height resolving a percentage child that is itself
  asking for a percentage is circular — it collapses to zero. Measured
  exactly that way: a 228px-wide frame **0px tall** at every width above
  `md`, while every other number on the page stayed correct and the page
  still reported no overflow. `align-items: stretch` has already given the
  item a definite cross size; asking for it a second time takes it away.
  Below that item, `h-full` is fine — by then the parent is definite.
- **A phone stretches to the wrong thing.** There the row is the metadata's,
  about 100px, so stretching would SHRINK the picture. The mobile box keeps
  a declared 4:5 and `md:aspect-auto` hands the height over at the
  breakpoint.

**What did NOT go is the content.** Every paragraph, both lists and the
availability line all still render in full from the CMS.

**The colophon went in a second pass**, and it is the only thing on this
list that was content. It could go because the licence obligation inside it
went first — the contact marks are Tabler and MIT now (trap 38), so nothing
needed attributing. It was worth 85–102px on a phone and 35px at 1440.

Three things it turned on:

- **`my-auto`, never `justify-center`.** Flex centring overflows in BOTH
  directions and the half that goes up goes under the fixed corner marks,
  where it cannot be reached — there is no scrolling above zero. Auto
  margins collapse to nothing the moment free space runs out, so a page that
  outgrows its screen simply starts at the top and scrolls like any other.
  The index can use `justify-center` because its content always fits (trap
  41); this page's does not, at two widths.
- **`md:contents` is what lets one markup serve two shapes.** On a phone the
  metadata and the portrait are a ROW inside a wrapper; above `md` the
  wrapper stops generating a box and its two children become items of the
  row above, taking their places as the outer and inner columns of the
  project page's grammar. It is a plain div with no semantics, so
  `display: contents` has nothing to drop out of the accessibility tree.
  Verified: left-to-right order is `meta, prose, portrait` at 768, 1440 and
  1920.
- **The colophon lost `.st-measure`, and then lost everything.** Uncapping
  it took 300 characters from five lines to two; removing it took the rest.
  Both are recorded because the first was the right move while the block
  still had to exist, and the reasoning survives it: a reading measure is
  for prose, and the last and least-read line on a page that must fit a
  screen can have the full width.

**The budget, and it is the honest part.** One screen holds from **414px
wide up** — verified at 414x896, 768x1024, 1024x768, 1366x768, 1440x900 and
1920x1080, `scrollHeight - clientHeight` **0** at every one. Below that it
does not: **49px over at 375x667** and **230px over at 320x568**, down from
753 and 810 before any of this. It fails the honest way — the page starts at
the top and scrolls.

**Re-measured with the real copy** that replaced the placeholders (a
415-character body against 470, and four items per column against three):
still **0** from 414 up, **38px over at 375** and **296 at 320**. 375 got
shorter because the prose did; 320 got longer because on a phone the two
lists stack beside the portrait, and the fourth item in each is two more
lines there. No item wraps at any width — counted per text node with a
Range, and the control (a string long enough to wrap) reported 2.

That floor is the CONTENT's, not the layout's. At 375 the three seeded
paragraphs alone are ~240px of a ~506px budget, and 49px is roughly two of
their lines. **Do not chase it with type sizes.** Anything that closes the
last 49px by shrinking the prose is paying for a number with the thing the
page exists to say, and 320x568 is already the one size this site accepts
being short at (see the `list` view on `/works`).

Verified besides: no horizontal scroll at any width; the statement's real
ink has positive headroom in every line box — **13.31px** at 1440, 7.95 at
768, **4.95** at 414 and 320, the same floor trap 39 recorded; `.st-wash` at
opacity 1; **0** masked bodies left parked at any width, under `reduce`, or
arriving via the route curtain, where **21 of 21** blocks travel through up
to 78 distinct transforms; and **0** contrast failures with the control
confirming the sweep can still fail — forcing the `stack` label to `--ink-3`
gave exactly 1 at 3.88:1 and restoring gave 0, at 1440, 414 and 320.

**The first run of that control forced ZERO, and the sweep was worthless
until it did not.** The element it reached for was a wrapper with no text
node of its own, so nothing changed and nothing failed — which reads exactly
like a clean page. Aim a control at a leaf that actually carries text, and
check what it reported changing. The same sweep also has to resolve the
NEAREST painted background rather than the body's, or the label sitting on
`--well` is judged against paper and silently mismarked.

**44. The one element with no per-frame owner and no mask is the one that
will look broken.**
`/works` arrives as a cascade: the ring turns, its readout rolls with it,
and five small pieces of chrome rise out of masks behind them. The
readout's `/ 08` counter was in none of those groups. It cannot roll —
there is only one of it, where every other readout line is a stack of eight
— and nobody had given it a mask, so it was simply *there* the instant the
curtain lifted, beside a summary still rolling in on the same baseline. It
had been listed in trap 34 for two rounds as a thing with no arrival, which
is a description that reads as a decision until someone looks at it.

- **It belongs to the chrome cascade, not the roll.** It is static
  `.st-meta` with no per-frame owner, which is precisely the category
  `chrome(step)` exists for. It is step 4, one 60ms beat after `drag or
  scroll`, so the cascade still runs top to bottom down the page.
- **It could not be lifted out to reach its own call site.** Trap 36 is the
  record of why the readout is six cells of ONE grid rather than three
  columns of stacks: `items-baseline` groups by row. Moving the counter up
  into `Library` to sit beside the other four would put it in a different
  formatting context from the summary it is supposed to align with. So the
  pose is handed DOWN instead, and `Readout` gained two props.
- **`memo` still holds, and that was the constraint on the props.**
  `Readout` is memoised so React stays out of the way of `draw`, which
  writes every line's transform per frame (trap 21). `released` flips
  exactly once; `counterPose` is `useMemo`'d in `Library` against
  `viaRoute`, and `chromePose` moved to module scope so it could be. A
  fresh object per render would have re-rendered the readout on every mode
  switch. Verified: 130 distinct readout transforms across a wheel gesture
  and two mode switches, and the counter at exactly one position — `0.0` —
  throughout.
- **The mask is the CELL, not a span inside it.** A box with `overflow`
  other than visible does not propagate its child's baseline; it offers its
  own bottom margin edge. Nesting a `.st-line` one level down would have
  put such a box between the grid cell and its text and moved the baseline
  trap 36 measured. As the cell itself, the clip sits exactly where the
  summary's own `.st-roll` sits in the cell beside it.
- **`ENTRY_TOTAL_MS` had to grow with the group.** It hard-coded `3 *
  ENTRY_CHROME_STAGGER_MS` for four items. `arrived.current` flips on that
  total, so an undercount declares the arrival finished while its last item
  is still moving. It reads `ENTRY_CHROME_COUNT - 1` now.

Verified at 1440x900 on the route path: all five chrome items park at
**18.4px** and travel through **46** distinct positions each, landing at
3944 / 4011 / 4070 / 4128 / **4186**ms — 59ms apart against the 60ms beat,
with `/ 08` last. Under `reduce` it ends at rest; it rides the same
`.st-line-body` transition as the other four, which the global block
flattens to 0.01ms.

**And row two was re-measured with trap 36's HARDER control, because the
easy one proves nothing here.** Both row-two items are the same size, so
top-alignment and baseline-alignment agree by coincidence: forcing
`items-start` moved nothing, and a first run reported a clean 0.00 that
meant only that the probe was blind. Blown up to 34px the counter stays
coincident at **0.00** under `items-baseline` at 375, 768, 1024, 1440 and
1920, and splits by **22–24.5px** under `items-start`. The alignment
survived the mask by construction, and now there is a measurement that
could have said otherwise.

**45. `dynamicParams = false` plus on-demand revalidation is a 404 on
every project page.**
The project route used to export `dynamicParams = false`, on the contract
that the set of projects is fixed at build. That was harmless while nothing
ever invalidated a page. The first save in `/admin` after
`revalidateSite` went in did: on `next start`, all five `/work/<slug>`
pages answered **200 before the save and 404 on every visit after it**,
with `Internal: NoFallbackError` in the server log. An invalidated
prerender is treated as a param with no fallback, and `false` means there
is none. `/`, `/works` and `/about` were unaffected, which is exactly why
it would have shipped: they are the pages anyone checks.

It is gone, and the page's own `notFound()` is what keeps an unknown slug a
404 — verified, `/work/not-a-project` is 404 after the change. The same
change is what lets a project added in the CMS have a page without a
build.

**Verify revalidation on `next start`, never on `next dev`.** The dev
server renders every request from the database, so it shows a CMS edit
immediately with or without the hook and proves nothing. The test that
does: build, start, confirm `x-nextjs-cache: HIT`; change something from a
`payload run` script (outside Next) and confirm the page is STILL the old
one — that is the control, and it is what production did before the hook;
then make a change from inside a Next request and confirm the next visit is
a `MISS` carrying the new value. Measured that way: control stale on all
five pages checked, then fresh on every one, all 200. Nothing in this repo
logs in to the admin to do it, so the inside-Next write was a throwaway
route handler that was deleted afterwards — if you do the same, check
`git status` for it and re-run `tsc` after the next build, because
`.next/types` keeps a reference to it until then.

**46. A sticky column can be taller than the room it sticks in, and the
CMS decides whether it is.**
The project page's spec sheet stuck at a fixed offset under the top chrome.
With placeholder copy that always fit. With the real copy — a six-line
paragraph, three roles and up to five stack items — Defiant's sheet ran
**23px** past the room at 1366x768 and **126px** at 1366x657, which is the
viewport a 1366x768 screen actually leaves a browser. What sat in the
overflow was the last row, `Visit the site`, parked under the bottom corner
marks for the whole length of the shot stack.

Trimming the copy would have fixed that one measurement and nothing else:
the text is in the CMS, so the next edit spends the room again, without a
build. So the column now sticks by whichever end it has to.
`PinnedColumn` writes its own height into `--pinned-h` and nothing else;
`.st-pinned` takes `min()` of the old top and the top that puts the foot
1rem clear of `--chrome-bottom`. It cannot loop: the observer watches the
box's height, and `top` moves the box without resizing it.

`--chrome-bottom` is new and derived the way `--chrome-top` is — gutter,
one line of `.st-meta`, the 2.5rem of clearance — and resolves within **0.3px** of
the measured bar at 768, 1024, 1366, 1440 and 1920, always on the long
side (103.2 against 102.9 at 1440x900).

Verified mid-scroll at 1366x657, 1280x720 and 1366x768 on the two tallest
sheets: the link **15px** clear of the bottom chrome everywhere (1rem at
that root size), against **-126px** with the old fixed top as the control.
At 1440x900 and 1920x1080 the computed `top` is 136.62 and 157.74px — the
old value exactly, so a sheet that fits behaves as it always did. The cost
is the other end: when the sheet does not fit, its HEAD scrolls away under
the top chrome instead. That is the right end to lose — the label `about`
has already been read, and the link has not been reached.

**47. A curtain that opens when the route arrives opens onto pictures that
have not.**
The complaint was a flicker as the route curtain left, and it was the
images. `reveal` used to start the uncover the moment the route committed,
and on a production build with a cold image cache, at the instant the panel
began to move: about to `/works`, **3 of 3** visible images not loaded; to
`/work/soluis`, **6 of 7**; to `/work/mark-woodland`, **4 of 9**. The last
of them landed up to **1566ms** after the uncover started, and the panel is
gone in 640ms — so the reader watched the page arrive and then watched its
pictures pop in, one at a time.

The panel now waits for them. Three things decided how:

- **"On screen" is measured after the scroll reset, not before.** `toTop`
  used to run at the start of the uncover; it now runs when the wait begins,
  still under the closed panel, so the set of images is the one at the top
  of the page the reader is about to be on rather than wherever they left
  the last one.
- **Loaded is not ready; decoded is.** `complete` says the bytes are here.
  A 3024px screenshot can still be decoded on the frame it is first painted,
  which is a blank box for that frame. `pictureReady` waits for `load` and
  then `img.decode()`. A broken image resolves instead of rejecting — it is
  not going to get more ready, and a stuck curtain is the worse failure.
- **The ring declares its covers, because position cannot.** `/works` turns
  through a whole revolution on arrival (trap 35), so every cover crosses the
  screen in the first second, and waiting only for the three in view would
  have moved the pop from the uncover to the spin. The ring's `<ol>` carries
  `data-await-images`, and its covers are `Shot eager` — a lazy image off to
  the side is one the browser may not have requested yet, and a wait on it
  runs straight to the cap. Any page whose arrival brings pictures ON to the
  screen needs the same attribute.

**Two caps, not one.** `HARD_CAP_MS` (3s) is about the ROUTE not arriving,
and when it fires there is nothing new to wait for pictures of, so it opens
with `reveal(true)`. Once the route has arrived that timer is swapped for
`IMAGES_CAP_MS` (4s from arrival): a single 3s cap would have given a route
that arrived at 2.9s's pictures 100ms. A navigation counter stops a late
`Promise.all` from opening a curtain it does not belong to.

Measured after, same four navigations, cold cache: **0** images not ready at
the start of the uncover on every one, the ring's 5 covers included, and
every image load BEFORE it — the last at −1ms and −2ms, which is the gate
visibly doing the holding. The cost is real on a cold cache and only there:
the uncover starts at 2179 / 2544 / 2301 / 1179ms against 1139 / 1219 / 1459
/ 1181. With the cache warm the timings are **identical to before** —
1139 / 1219 / 1458 / 1179ms — because the pictures finish 600–900ms before
the name has finished standing.

Both caps were forced: every `/_next/image` request held 8s opened the
panel at **4524ms** (the route arrived at ~505ms), and the route itself held
5s opened it at **3010ms** onto the old page. Both ended with the attribute
gone, `#content` at opacity 1 and Lenis running. The destination still
arrives: 19 distinct headline transforms after a normal navigation, 3 under
`reduce`, **0** masked blocks left parked, scroll at 0, focus on `#content`.

**Measure this on `next start` with `.next/cache/images` deleted.** The
optimizer's cache is what makes the difference between the two sets of
numbers above, and a warm one hides the bug completely. Two probe traps
found on the way: an `addInitScript` that observes `document.documentElement`
runs before that element exists and silently registers nothing — observe
`document` with `subtree` — and Playwright's route handlers here have no
`setTimeout`; use `page.waitForTimeout`.

**48. A layer that stands in for text has to be proven identical before
the text is hidden — and "nothing is animating" is not proof that nothing
is moved.**
The masthead's letters change weight under the pointer (`usePressure`, the
Motion section). The heading's own text cannot do that — one text node has
one weight — and splitting it into a span per letter loses the kerning
(trap 10). So the text is left exactly as it is, and a layer of one element
per letter is laid over it on the first pointer move, placed where a Range
over each character of the real text says that character is. The real text
goes transparent only after every letter has been CHECKED onto it.

- **The font had to become a variable file, and its Regular is not at
  400.** The three static cuts are gone; one 29KB file on a weight axis of
  200 to 700 replaced 46KB of them. Checked glyph by glyph against the
  statics before anything else moved: advances identical at 378, 500 and
  700, outlines identical at 700 and within half a unit of a thousand at
  the others. **But the variable font's Regular instance sits at 378**, so
  `font-weight: 400` would have been a slightly heavier face than the one
  the readout on `/works` was designed in. `.st-display-reg` asks for 378.
- **The text is never touched, and that is three guarantees at once.** It
  is the accessible name; it is what `useFittedText` sizes; and it is what
  the preloader matches its own copy against by `textContent` (trap 10).
  The layer is `aria-hidden` and draws its glyphs from `data-char` through
  `::before`, so `textContent` never reads the name twice.
- **Pinning is layout, not arithmetic.** A slot is the letter's width at
  700 — the widest it can get, and the width it has at the one moment the
  layer is built — and two empty flex items share whatever the letter gives
  up in the ratio `--pin`: 0 for the first letter, 1 for the last. No width
  is read back per frame, and nothing carries a transform, because a
  transform puts glyphs on their own raster path and the swap would show
  (trap 10).
- **The readiness test took three conditions, and the third was found by
  its control.** No curtain up; the preloader's element gone, not merely its
  attribute, because the attribute comes off mid-dissolve; and nothing
  between the text and the heading carrying a transform. "No animation
  running" alone looks sufficient and is not: on the route path the name is
  PARKED 145% below its mask for a frame after the curtain lets go and
  before the rise starts, with nothing running at all. Measured by firing a
  pointer move on every frame of the navigation: exactly **one** such frame
  on each of three runs, and a layer built there would sit 145% low, outside
  the mask that hides the text. With the transform test, **0** frames with
  a layer over a moved text, and the layer arrives the frame the rise ends.
- **A finished animation with a forwards fill is still in
  `getAnimations()`.** The corner marks' `st-fade` stays there for good, so
  a probe or a test that asks for the list to be empty waits forever. Ask
  whether any is `pending` or `running`.
- **The rAF loop stops when nothing moves**, and the count of that has a
  control too: the callback is `usePressure.useEffect.step` in development,
  not `step`, so a filter on the short name counted **0** while the pointer
  moved, which reads exactly like a loop that has stopped. With the real
  name: 53 scheduled across one gesture, **0** in 800ms of stillness.

Verified at 1440x900, DPR 2, on the load path and the route path: letters
on the text's own positions to **0px** in layout; photographed with every
frame held so no weight had moved, **175 of 1.82M** device pixels differ,
all on the diagonals of the `x` and one edge of the `y`, none on `M a H n
h` — sub-1/64px glyph placement (a run positions glyphs in floats, an
element starts on a layout unit), at a 494-device-px size where Skia draws
glyphs as paths. The two photographs of the untouched page, taken back to
back, differ by **0**; after the pointer leaves and the layer is removed,
the page is **0** pixels from where it began. Across a sweep of 465 frames:
first and last letter **0px** from their slots' outer edges, the first slot
**0.005px** from the column's margin, weights 200 to 698, **420**
distinct weight sets, median frame 13.3ms and **0** over 20ms. At 320 and
768, driven by a finger through CDP: ends 0px, margin 0, no horizontal
overflow, and the layer gone after the lift. Under `reduce`, no layer. A
resize removes it at once. The preloader's letters still land on the
masthead at **0px** on every frame of the dissolve, and the mask's headroom
reads 13.0/4.0 at 320 — trap 29's numbers, unchanged, as identical outlines
at 700 said they would be.

## Accessibility invariants

Measured in the browser, not computed from the tokens alone: `--ink`
16.09:1, `--ink-2` 5.05:1, `--ink-3` 3.88:1, and `--ink` on `--well`
9.66:1 (`--well` itself is 1.67:1 against paper — see trap 7). A full sweep of every text node returns zero failures against the
size-appropriate bar on all three page types — 60 nodes on the ring, 91 on
the list, at 320 and at 1440, with the control confirming the sweep can
still fail.

**`--ink-3` is only safe as LARGE text, and "large" for bold type starts
at 18.66px.** It dimmed the index work list's rows, which were never that
small; with that list gone (trap 41) it carries no text at all and anything
put back on it has to clear the bar afresh.
The preloader's pending name is not display-sized: at 320px it computes to
about 17px, where the bar is 4.5:1 and `--ink-3` fails. It uses `--ink-2`
instead. Check the computed `font-size` at 320, not the one you designed
at 1440.

**Always run the control.** A sweep that reports zero failures is worthless
until you have made it report one: paint a single small label at a failing
value, confirm the count goes 0 → 1, then restore it.

**Two measurement traps, both of which produced wrong answers here:**

- **Counting `getClientRects()` to detect a two-line clickable is wrong, in
  BOTH directions.** On an inline element it over-counts: a single-line
  inline returns one rect *per text node*, so `{first} {last}` in JSX yields
  three rects on one line and every run flagged the masthead link. Counting
  **distinct rounded `y` values** fixes that — and then silently under-counts
  on a BLOCK element, which returns exactly one rect however many lines it
  holds. `.st-line-body` is `display: block`, so that probe reported a clean
  zero while the address was wrapping at 320 (trap 38).

  **The measurement that works on both is a `Range` over the element's own
  text node**, which reports one rect per line box either way (and touch
  `el.getBoundingClientRect()` first, per trap 18). The version before all of
  these compared height to line-height, which counted padding as a second
  line. Two probes, two opposite failures, and the second one is the
  dangerous kind: it fails quiet.
- Do not filter screenshot pixels by luminance to find a backdrop. Text
  antialiasing covers every intermediate value, so "the brightest mid-tone"
  is a letter edge and the number comes back identical everywhere.

Other invariants:

- **Do not dim whole rows.** `Work` dims only the large title; the readout
  beside it stays at full ink.
- **The fixed corner marks float, and on a page that scrolls, content
  passes under their text. That is a decision the owner took, not a
  defect.** Until then a paper gradient behind each row (solid for 72%,
  fading out) kept body copy from sliding under them, and this line read
  "must stay opaque behind their own text". The owner asked for the band to
  go. Measured on `/work/soluis` straight after, sampling every 20px of
  scroll: a mark's text sits over an image at **96%** of positions and over
  a line of text at **13%** at 1440x900, and **90% / 48%** at 375x667,
  where the marks span the same width as the column and the spec sheet's
  prose runs straight through `Max Huynh` and the address. Even at rest, at
  1440x900 the first shot's right edge sits 10px under `work`. What did
  NOT change is where content comes to rest: the rows keep their 2.5rem
  of clearance, so `--chrome-top` / `--chrome-bottom`, the sticky spec
  sheet (still 136.62px at 1440x900) and `scroll-padding-top` are exactly
  what they were. `pointer-events` is still off on each full-width row and
  back on for the text, or the rows would swallow clicks across the page.

  **What keeps them legible over a shot is `mix-blend-mode: difference`**
  (`.st-blend`, the owner's pick over hiding them on scroll). Three things
  it turned on:

  - **It goes on the fixed ROW, not the text.** A fixed, z-indexed row is a
    stacking context, and blending never reaches past the one it happens
    in: text blended inside the row blends with the row's own transparent
    nothing and changes no pixel.
  - **The palette is re-derived inside the rows, not inverted by eye.**
    Difference paints `|backdrop - colour|`, so each colour is `--paper`
    minus the ink it has to land on, per channel — `#dbdcdb`, `#848a8f`,
    `#72787d` — and `--paper` goes to `#000` so the selection still reads
    paper on ink. Verified on flat paper at 1440 and 375, DPR 2, against the
    same rows with the blend switched off in the same run: at most **1/255**
    on ~2,500 edge pixels, rest, focus ring and selection alike, with a
    control of **0**. These are derived numbers; trap 7 applies to them.
  - **It is better, not solved.** Over content on `/work/soluis`, every
    40px of scroll, ~330 text boxes per width: median contrast **5.16:1**
    at 1440 and **4.99:1** at 375, against **1.93 / 2.3** for plain ink with
    no band; the blend wins in 73–79% of cases. But **40% / 47%** are still
    under 4.5:1 and **25% / 26%** under 3:1 — difference has a dead zone
    wherever the backdrop is near half the source colour, and these are
    0.78rem labels. Over a coloured picture the marks also take a hue from
    it (bluish on beige, tan on sky), which is the one place type on this
    site is ever not ink — derived from the imagery, which is the only
    colour the site allows. And it does nothing for text over TEXT: at 375
    the spec sheet's prose still runs straight through `Max Huynh`.

  (The dev server served the old `global.css` after this rule went in —
  the class was in the HTML and not in the chunk. Trap 42 again; it was
  measured on `next start`.)
- **Visual echoes are `aria-hidden`, and what they echo must exist
  elsewhere.** The ring's readout is hidden, so each cover link's own
  accessible name carries the name, summary, category and year. The empty
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
- Seven things honour `prefers-reduced-motion` — the CSS block, Lenis
  (which is not constructed at all under `reduce`), the preloader (which
  shows the line assembled instead of assembling), `PageTransition` (which
  drops the wipe for a fade), `/works`, where both the ring and the
  gather between views are assigned rather than walked, and the masthead's
  pressure (`usePressure`), which never builds its layer at all. Everything
  after Lenis reads the query in JavaScript, because the CSS block cannot
  reach a GSAP tween or a rAF loop; add another motion source and it will
  need its own check too. The list's rows are the exception that proves it: their rise is a CSS
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
  click, the ring a wheel, a drag or an arrow key, a project page's
  thumbnail marker the reader's own scroll position, and the masthead's
  letters the pointer — which is also why they do nothing until the pointer
  first moves.
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
  accessible name — the same rule the empty `Shot` field follows.
- The list's rows dim to `--ink-2`, not `--ink-3`. At 320 the name computes
  to about 17px, under the 18.66px where bold type counts as large, so the
  bar is 4.5:1 and `--ink-3` (3.88:1) fails it. Only the name dims; the
  number and the metadata beside it stay put.
- **The route curtain must always let go.** `PageTransition` caps the hold
  at 3s for the ROUTE, and once the route has arrived gives its pictures at
  most 4s more (trap 47), and reveals anyway; its cleanup calls `lenis.start()` even if the
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

The cheapest way to hold either one still is **`gsap.globalTimeline.pause()`
from inside the snippet**, a fixed delay after the click. Both curtains are
GSAP, so it freezes the panel and everything on it exactly where they are,
and a screenshot and a full set of rects can be taken at leisure; resume
afterwards. That is what the route-delay trick below is for when the
question is about the WAIT rather than about a pose — it is heavier and it
is easy to leave a `page.route` handler armed for the next navigation.

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
