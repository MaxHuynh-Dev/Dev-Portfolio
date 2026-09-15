# Portfolio Editorial — design spec

Date: 2026-09-15
Source: Claude Design project `4b95b54a-f8cd-460f-8e37-36a18a93be0a`, file `Portfolio Editorial.dc.html`

## Goal

Replace the existing neon portfolio homepage with a faithful port of the
"Portfolio Editorial" design: a Swiss/editorial brutalist single page with a
WebGL hero backdrop.

## Decisions

| Decision | Choice |
|---|---|
| Placement | Replace `/`. Neon sections deleted; recoverable at commit `c1859b8`. |
| Content | Real details supplied by the owner. Until supplied, obvious placeholders in one file. No fabricated identity, no fabricated awards. |
| WebGL hero | Ported in full, `three` as a dependency, lazy-loaded client-side. |
| Images | Styled `#141414` wells wired through `next/image`-ready components. |

## Design system

- Background `#0A0A0A`, foreground `#F2EFE9`, mono-meta `#8C8C88`,
  body `#B6B3AC`, image well `#141414`, hairline `rgba(242,239,233,0.14)`.
- Accent is a single token, default `#F2EFE9`; alternates `#D7FF3E`,
  `#FF5A2B`, `#7BA7FF`.
- Display/body: Schibsted Grotesk. All labels: JetBrains Mono, uppercase,
  `0.13em` tracking, `0.66rem`.
- Fluid root: `html { font-size: clamp(15px, 0.5vw + 8.4px, 21px) }`. The
  whole page scales from this one value. It also redefines every Tailwind
  rem utility site-wide — accepted deliberately, since editorial is now the
  entire site.
- Gutter: `--gut: clamp(1rem, 3.4vw, 2.5rem)`. Full-bleed; `Container` is
  intentionally bypassed.

## Structure

Fixed layers: WebGL stage (z0) -> vignette (z0) -> 4-column rule overlay
(z1) -> cursor preview frame (z40) -> header + bottom HUD (z60, both
`mix-blend-mode: difference`).

Flow: Hero -> Selected work -> Marquee -> Index -> About -> Contact.

## Deviations from the source, and why

1. **Fonts self-hosted** via `next/font/google` instead of a
   `fonts.googleapis.com` `<link>`. Removes a render-blocking third-party
   request and the attendant layout shift.
2. **GSAP ScrollTrigger replaces IntersectionObserver** for reveals. The app
   already runs Lenis wired to ScrollTrigger; a raw observer would fight it.
3. **`scroll-behavior: smooth` dropped.** It conflicts with Lenis. Anchors
   route through `window.lenis.scrollTo`.
4. **three.js modernised.** The source pins `three@0.149` via unpkg and calls
   `outputEncoding` / `sRGBEncoding`, both removed in `0.186`. Uses
   `outputColorSpace` / `SRGBColorSpace`, npm dependency, no CDN tag.
5. **Accessibility defects fixed rather than ported:**
   - All 8 index rows pointed at `#contact`; work cards pointed at `#index`.
     Both now take real per-project hrefs.
   - Hover-only preview gave keyboard users nothing. Focus now drives the
     same state; the preview itself is `aria-hidden` decoration.
   - No `:focus-visible` styles anywhere. Added throughout.
   - `mix-blend-mode: difference` over the WebGL stage can crush contrast.
     Contrast-checked, solid fallback where it fails.
   - Copy-email button signalled success visually only. Adds `aria-live`.
6. **Motion + power guards added:** `prefers-reduced-motion` renders a single
   static WebGL frame; the render loop pauses on tab blur.

## Out of scope

Strapi wiring, CMS content, blog/case-study subpages, i18n.
