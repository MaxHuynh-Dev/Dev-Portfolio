@AGENTS.md

# Dev-Portfolio

A single-page editorial portfolio. Swiss/brutalist: near-black ground, warm
off-white type, mono metadata, hairline rules, and a WebGL `</>` glyph behind
the hero. Ported from a Claude Design file (`Portfolio Editorial.dc.html`).

The repo began as a generic Next.js template. **Most of that template is gone** —
if you find advice about a neon/glassmorphism "Alex Nguyen" portfolio, it is
stale. That build was deleted; it survives only in commit `c1859b8`.

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
app/(frontend)/(withoutFooter)/page.tsx   the homepage (server component)
src/modules/EditorialHome/
  Shell.tsx        THE client boundary — reveals, WebGL gate, backdrop layers
  index.tsx        server component; composes Shell + sections
  constants.ts     ALL site content
  Stage.tsx        three.js hero backdrop
  Hero|Work|Marquee|ProjectIndex|About|Contact.tsx
src/components/editorial/  MonoLabel, SectionHead, MetaColumns, ImageWell
src/layout/EditorialHeader|EditorialHud/   fixed top/bottom chrome
src/styles/global.css      design tokens + .ed-* primitives
```

Path aliases: `@Components @Modules @Layout @Hooks @Constants @Utils @Styles @/*`.

## Content

**All copy, projects and links live in `src/modules/EditorialHome/constants.ts`.**
Nothing else hardcodes content; `src/constants/common.ts` derives site metadata
from it. Change content there and nowhere else.

Current values are placeholders marked `TODO`. Two standing rules:

- **Never invent biographical facts** — name, location, employers, clients.
- **Never invent awards, metrics or credentials.** The source design shipped
  fake Awwwards/CSSDA/FWA claims; they were deliberately removed. Do not
  reintroduce that kind of claim unless the owner states it is genuine.

## Traps

These are not style preferences. Each one was a real bug here.

**1. `.ed-*` primitives must stay inside `@layer components`.**
Tailwind v4 puts utilities in `@layer utilities`, and unlayered rules beat
layered ones regardless of specificity. Outside a layer, `.ed-label` silently
defeats any `normal-case` or `tracking-*` set beside it — the email rendered
uppercase for exactly this reason. Keep `html`, `body`, `::selection`,
`:focus-visible` and the reduced-motion block unlayered; they rely on it.

**2. The root font-size is fluid, and it redefines every rem.**
`html { font-size: clamp(0.9375rem, 0.5vw + 0.525rem, 1.3125rem) }`. Tailwind's
whole spacing scale resolves against it, so `p-4` is not 16px. Keep it in `rem`,
never `px` — a px root overrides the reader's own font-size preference
(WCAG 1.4.4).

**3. Lenis owns scrolling.**
`window.scrollTo` is a no-op and fires no scroll events. Use `window.lenis`.
Never add `scroll-behavior: smooth` — it fights Lenis. ScrollTrigger is wired to
Lenis in `SmoothScroll`, which also refreshes on `document.fonts.ready` because
webfont swap invalidates cached trigger positions.

**4. In-page links must go through `useAnchorNav`.**
`preventDefault()` cancels the whole navigate-to-fragment step — not just the
jump, but the hash update *and* the focus move. The hook restores both. A bare
`<a href="#x">` with a scroll handler leaves keyboard and screen-reader users
stranded on the link.

**5. `Shell.tsx` is the only client boundary for page sections.**
Sections are static JSX over frozen data and must stay server components. If you
add `'use client'` to `EditorialHome/index.tsx` or a section, you pull all of
them plus `constants.ts` into the bundle. `ProjectIndex` is client because it
owns hover/focus state — that is the exception, not the pattern.

**6. `constants.ts` is on the server metadata path.**
`src/constants/common.ts` imports it. It must stay plain data with no imports —
a single `import ... from 'three'` there breaks `next build`.

**7. `Stage.tsx` targets three 0.186, not the prototype's 0.149.**
`outputEncoding`/`sRGBEncoding` are gone (`outputColorSpace`/`SRGBColorSpace`),
legacy light intensities need a `Math.PI` factor, and an animated equirect
`CanvasTexture` environment must be convolved through `PMREMGenerator` by hand —
three only auto-refreshes PMREM for render-target textures. It is mounted behind
a `matchMedia('(min-width: 900px)')` gate: CSS-hiding alone still downloads the
chunk and allocates a GPU context on phones.

**8. Hydration.** The HUD clock renders `--:--` on the server and starts in an
effect; `stageEnabled` starts `false` on both sides. Keep any new time-, random-
or `window`-dependent value out of render.

## Accessibility invariants

The design is stark by intent — do not "fix" the dark palette. The base tokens
pass AA comfortably (`#8C8C88` 5.87:1, `#B6B3AC` 9.46:1, `#F2EFE9` 17.25:1 on
`#0A0A0A`). Failures come from *state*, so:

- **Do not dim whole rows.** At 0.42 opacity over `#0A0A0A` nothing reaches
  4.5:1 — even pure white caps at 4.17. `ProjectIndex` dims only the large
  title, which passes the 3:1 large-text bar; metadata stays at full opacity.
- **`mix-blend-mode: difference` needs a constrained backdrop.** It renders a
  glyph as |text − backdrop| and hits zero contrast where the backdrop is half
  the text value. The fixed chrome paints an opaque scrim; only an inner wrapper
  carries `.ed-chrome`. Never blend directly over arbitrary content.
- **Keep decorative things out of the AX tree**: marquee, stage, vignette, grid
  overlay, cursor preview, the painted hero name halves, and `ImageWell`'s
  placeholder caption (it lands in the link name otherwise).
- Hover states need a focus equivalent. Sections keep their `aria-labelledby`.
- Four things honour `prefers-reduced-motion` — the CSS block, `gsap.matchMedia`
  in `Shell`, `Stage.tsx`, and Lenis. Add a fifth motion source, cover it too.

## Verify before claiming

Run `yarn build` and `npx tsc --noEmit`. For UI, inspect the DOM rather than
trusting a screenshot: **if the Browser pane is hidden, screenshots come back
solid black** even though the page renders fine. Programmatic `.focus()` and
synthetic `mouseover` also do not reliably fire React handlers without system
focus — use real key/wheel input, or assert on the rendered style attributes.
