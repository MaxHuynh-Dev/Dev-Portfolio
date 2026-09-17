@AGENTS.md

# Dev-Portfolio

A portfolio for a front-end engineer, on warm paper (`#efedea`) with true
ink type and **no accent colour at all**. Emphasis is carried by size,
weight and position; hover and focus by an underline. The only colour the
site will ever have is the project imagery.

Two kinds of page:

- **`/`** — the index. Masthead, work list, about, contact. The work list
  is the way in: one row is live at a time and its cover, summary and
  position sit beside it at eye level.
- **`/work/<slug>`** — one page per project. A sticky spec sheet on the
  left, a stack of shots down the middle, a rail of thumbnails on the
  right, and the next project at the foot.

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
src/modules/Project/
  index.tsx        the three-column project view
  SpecSheet.tsx | ShotStack.tsx | NextProject.tsx
src/components/Shot.tsx    one image, or the field it will go in
src/components/Preloader/  curtain (index.tsx) + pre-paint boot script (boot.ts)
src/hooks/useFittedText.ts the fitting engine
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

## Accessibility invariants

Measured in the browser, not computed from the tokens alone: `--ink`
16.09:1, `--ink-2` 5.05:1, `--ink-3` 3.88:1, and `--ink` on `--well`
12.87:1. A full sweep of every text node returns zero failures against the
size-appropriate bar on both page types.

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
  current shot has `aria-current` as well as an outline.
- Three things honour `prefers-reduced-motion` — the CSS block, Lenis
  (which is not constructed at all under `reduce`), and the preloader
  (which drops the wipe for a plain fade). Add a fourth motion source,
  cover it too.
- Motion answers actions. The only non-user-triggered motion is the single
  load gesture: the preloader handing off to the masthead's mask-rise
  mid-wipe.

## Verify before claiming

Run `yarn build` and `npx tsc --noEmit`. For UI, inspect the DOM rather
than trusting a screenshot: **if the Browser pane is hidden, screenshots
come back solid black** even though the page renders fine. A hidden pane
also reports `document.hidden === true` and fires **zero rAF callbacks**, so
the preloader counter looks frozen at its initial value. That is the
harness, not a bug. Drive those through Playwright, which composites for
real.

The dev server has served stale CSS twice after a rewrite of
`global.css`. If a token or a new rule appears not to apply, restart it
before debugging anything else.

Responsive is checked at **320 / 375 / 414 / 768 / 1440**, on the index
*and* on a project page: no horizontal scroll, `overflow-x: clip` on both
`html` and `body` (`clip`, never `hidden` — `hidden` makes the element a
scroll container and breaks `position: fixed` on descendants), no clickable
wrapping to two lines, and nothing extending past the viewport edge.

Run the 3dviz-pro-max skill's scripts with `/opt/homebrew/bin/python3.12`;
the system `python3` is the Xcode stub and needs a sudo license agreement.
