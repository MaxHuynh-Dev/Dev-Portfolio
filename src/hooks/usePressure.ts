'use client';

import { type RefObject, useEffect } from 'react';

/** The masthead's own weight, and the top of Nippo's axis. */
const HEAVY = 700;
/** The bottom of it. */
const LIGHT = 200;
/**
 * How far the letters' idea of the pointer closes on the real one: this
 * share of the remaining distance per 60Hz frame. It is TextPressure's 1/15,
 * made per-millisecond so a 120Hz screen does not run it twice as fast.
 */
const FOLLOW = 1 / 15;
const FRAME_MS = 1000 / 60;
/** Close enough to call the chase over and let the loop stop. */
const SETTLED_PX = 0.1;
const SETTLED_PRESENCE = 0.001;
/** How far a letter may land from the text's own before the swap is refused. */
const PLACED_PX = 0.5;

type Letter = {
  glyph: HTMLSpanElement;
  /** The letter's resting centre, relative to the heading's box. */
  cx: number;
  cy: number;
  /** The weight last written, so an unchanged one is not written again. */
  weight: number;
};

/**
 * The masthead's letters thicken toward the pointer and thin away from it —
 * TextPressure (reactbits), on the one axis Nippo has.
 *
 * The original moves weight, width and slant, and needs a face with all
 * three. Nippo has weight only, 200 to 700, and the masthead already sits at
 * 700, so a letter can only get LIGHTER than it is at rest: the one nearest
 * the pointer stays as it was designed and the rest thin out with distance.
 * The falloff is the original's — linear, reaching the floor at half the
 * name's width.
 *
 * **Nothing changes until the pointer moves.** The heading's text is not
 * touched: it is the accessible name, what `useFittedText` sizes and what
 * the preloader matches its own assembled copy against (trap 10). What
 * moves is an `aria-hidden` layer of one element per letter, built on the
 * first pointer move and placed where a range over each character of the
 * real text says that character is — the preloader's own method, which is
 * what keeps the kerning (trap 10 again). Placement is CHECKED before the
 * real text is hidden, so the swap is between two identical frames or it
 * does not happen. The glyphs are drawn from `data-char` by `::before`, so
 * the heading's `textContent` never gains a second copy of the name.
 *
 * **The line keeps both of its ends.** A lighter letter is a narrower one,
 * and a line of narrower letters is a shorter line — which would pull the
 * name off the right margin it is fitted to. So each letter is pinned: the
 * first by its left edge, the last by its right, the ones between in
 * proportion, and the room a letter gives up opens between the letters
 * instead. Nothing can reach past either margin, because 700 is the widest
 * any letter can be and that is the width the slots are measured at. The
 * pinning is layout, not arithmetic: see `.st-press-slot`.
 *
 * **It waits for both curtains, and for the handover.** `data-preloading`
 * comes off mid-dissolve (trap 10), while the paper is still fading over a
 * name it has just landed exactly on, so the preloader's own element being
 * gone is the signal that the handover is over. On the route path the
 * name is still rising out of its mask for most of a second after the panel
 * clears, and a layer swapped in mid-rise would jump; the heading having no
 * running transition, and no transform left between its text and itself,
 * is that signal (see `atRest` for why it takes both).
 *
 * It lets go in both directions: when the pointer leaves the window, a
 * finger lifts or the tab loses focus, every letter eases back to 700 and
 * the layer is removed, handing the line back to the real text. A resize
 * removes it at once, because a refit moves every letter.
 *
 * Under `prefers-reduced-motion` it never starts. The loop only runs while
 * something is still moving.
 */
export function usePressure(ref: RefObject<HTMLElement | null>, text: string): void {
  useEffect(() => {
    const heading = ref.current;
    if (heading === null) return;

    const html = document.documentElement;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let layer: HTMLSpanElement | null = null;
    let letters: Letter[] = [];
    /** Where the pressure reaches the floor: half the name's run. */
    let reach = 1;
    let frame = 0;
    let last = 0;
    const target = { x: 0, y: 0 };
    const eased = { x: 0, y: 0 };
    let present = false;
    /** 0 is the name at rest, 1 is the name fully under the pointer. */
    let presence = 0;
    let size = { width: -1, height: -1 };

    /** The heading's own text node — inside the route path's mask or not. */
    const textNode = (): Text | null => {
      const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        if (node.nodeValue === text) return node as Text;
      }
      return null;
    };

    /** Same question the preloader asks (trap 18): is the face in use yet. */
    const faceReady = (): boolean => {
      const family = getComputedStyle(heading).fontFamily.split(',')[0]?.trim() ?? '';
      if (family === '') return true;
      try {
        return document.fonts.check(`${HEAVY} 100px ${family}`, text);
      } catch {
        return true;
      }
    };

    const ready = (): boolean =>
      !motion.matches &&
      !html.hasAttribute('data-preloading') &&
      !html.hasAttribute('data-routing') &&
      // Mounted until its dissolve has finished, which is later than the
      // attribute: see above.
      document.querySelector('.st-preloader') === null &&
      heading.style.getPropertyValue('--fit-size') !== '' &&
      // RUNNING, not merely present: a finished animation with a forwards
      // fill stays in this list for good, and would hold the layer off for
      // good with it.
      !heading
        .getAnimations({ subtree: true })
        .some((animation) => animation.pending || animation.playState === 'running') &&
      faceReady();

    /**
     * Whether the text is where it is going to stay: nothing between it and
     * the heading carries a transform.
     *
     * "No transition running" is not enough on its own. On the route path
     * the name is PARKED 145% below its mask from the moment the curtain
     * lets go until the rise is asked for a frame or two later — a gap in
     * which nothing is running at all — and a layer built then would be
     * built where the parked text is: too low, and outside the mask that
     * hides it.
     */
    const atRest = (node: Text): boolean => {
      for (let el = node.parentElement; el !== null && el !== heading; el = el.parentElement) {
        if (getComputedStyle(el).transform !== 'none') return false;
      }
      return true;
    };

    const activate = (): boolean => {
      const node = textNode();
      if (node === null || !atRest(node)) return false;

      // The element's rect first: it flushes layout, and a Range's does not
      // (trap 18).
      const box = heading.getBoundingClientRect();
      const range = document.createRange();
      const found: { char: string; left: number }[] = [];
      for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (char.trim() === '') continue;
        range.setStart(node, index);
        range.setEnd(node, index + 1);
        found.push({ char, left: range.getBoundingClientRect().left - box.left });
      }
      if (found.length === 0) return false;

      const next = document.createElement('span');
      next.className = 'st-press';
      next.setAttribute('aria-hidden', 'true');
      const built = found.map(({ char, left }, index) => {
        const slot = document.createElement('span');
        slot.className = 'st-press-slot';
        slot.style.left = `${left}px`;
        slot.style.setProperty(
          '--pin',
          String(found.length === 1 ? 0.5 : index / (found.length - 1))
        );
        const glyph = document.createElement('span');
        glyph.className = 'st-press-glyph';
        glyph.dataset.char = char;
        slot.appendChild(glyph);
        next.appendChild(slot);
        return { slot, glyph, left };
      });
      heading.appendChild(next);

      // Each slot is exactly as wide as its letter at 700 — which is the
      // weight every letter is at right now, so this is the one moment the
      // width can simply be read.
      const widths = built.map(({ glyph }) => glyph.getBoundingClientRect().width);
      built.forEach(({ slot }, index) => {
        slot.style.width = `${widths[index]}px`;
      });

      const origin = heading.getBoundingClientRect().left;
      const placed = built.every(
        ({ glyph, left }) =>
          Math.abs(glyph.getBoundingClientRect().left - origin - left) <= PLACED_PX
      );
      if (!placed) {
        next.remove();
        return false;
      }

      letters = built.map(({ glyph, left }, index) => ({
        glyph,
        cx: left + widths[index] / 2,
        cy: box.height / 2,
        weight: HEAVY
      }));
      const first = found[0].left;
      const end = found[found.length - 1].left + widths[widths.length - 1];
      reach = Math.max(1, (end - first) / 2);
      layer = next;
      size = { width: box.width, height: box.height };
      // Inline, because the heading's colour is a Tailwind utility and a
      // layered rule could not beat it (trap 1). The layer sets its own.
      heading.style.color = 'transparent';
      return true;
    };

    const deactivate = (): void => {
      layer?.remove();
      layer = null;
      letters = [];
      presence = 0;
      heading.style.color = '';
    };

    const stop = (): void => {
      if (frame !== 0) cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
    };

    const step = (now: number): void => {
      frame = 0;
      if (layer === null) {
        last = 0;
        return;
      }

      const dt = last === 0 ? FRAME_MS : Math.min(now - last, 100);
      last = now;
      const follow = 1 - (1 - FOLLOW) ** (dt / FRAME_MS);

      eased.x += (target.x - eased.x) * follow;
      eased.y += (target.y - eased.y) * follow;
      const goal = present ? 1 : 0;
      presence += (goal - presence) * follow;

      const chased =
        Math.abs(target.x - eased.x) < SETTLED_PX && Math.abs(target.y - eased.y) < SETTLED_PX;
      if (chased) {
        eased.x = target.x;
        eased.y = target.y;
      }
      const arrived = Math.abs(goal - presence) < SETTLED_PRESENCE;
      if (arrived) presence = goal;

      // Read once, before any write this frame.
      const box = heading.getBoundingClientRect();
      const x = eased.x - box.left;
      const y = eased.y - box.top;
      for (const letter of letters) {
        const pressure = Math.max(0, 1 - Math.hypot(x - letter.cx, y - letter.cy) / reach);
        const weight = Math.round(HEAVY - presence * (1 - pressure) * (HEAVY - LIGHT));
        if (weight !== letter.weight) {
          letter.glyph.style.fontWeight = String(weight);
          letter.weight = weight;
        }
      }

      if (arrived && goal === 0) {
        // Every letter is back at 700, which is the real text exactly.
        deactivate();
        last = 0;
        return;
      }
      if (chased && arrived) {
        last = 0;
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const wake = (): void => {
      if (frame === 0 && layer !== null) frame = requestAnimationFrame(step);
    };

    const press = (x: number, y: number): void => {
      target.x = x;
      target.y = y;
      present = true;
      if (layer === null) {
        if (!ready() || !activate()) return;
        // Start the chase where the pointer is rather than sweeping in from
        // wherever it was last seen; `presence` is what eases the name in.
        eased.x = x;
        eased.y = y;
      }
      wake();
    };

    const lift = (): void => {
      present = false;
      wake();
    };

    const onPointer = (event: PointerEvent): void => {
      // Touch has its own listeners below: a pointer stream is cancelled the
      // moment the browser decides a drag is a pan, and touch events are not.
      if (event.pointerType === 'touch') return;
      press(event.clientX, event.clientY);
    };
    const onTouch = (event: TouchEvent): void => {
      const touch = event.touches[0];
      if (touch !== undefined) press(touch.clientX, touch.clientY);
    };
    const onMotion = (): void => {
      if (!motion.matches) return;
      present = false;
      stop();
      deactivate();
    };

    // A refit moves every letter, so the layer goes at once rather than
    // easing out of positions that are no longer the text's.
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (layer === null || rect === undefined) return;
      if (rect.width === size.width && rect.height === size.height) return;
      stop();
      deactivate();
    });
    observer.observe(heading);

    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });
    window.addEventListener('touchend', lift);
    window.addEventListener('touchcancel', lift);
    window.addEventListener('blur', lift);
    html.addEventListener('mouseleave', lift);
    motion.addEventListener('change', onMotion);

    return () => {
      stop();
      deactivate();
      observer.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('touchstart', onTouch);
      window.removeEventListener('touchmove', onTouch);
      window.removeEventListener('touchend', lift);
      window.removeEventListener('touchcancel', lift);
      window.removeEventListener('blur', lift);
      html.removeEventListener('mouseleave', lift);
      motion.removeEventListener('change', onMotion);
    };
  }, [ref, text]);
}
