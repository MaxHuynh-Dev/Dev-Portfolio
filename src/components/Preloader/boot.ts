/**
 * The pre-paint half of the preloader.
 *
 * This ships as a blocking inline script in `<head>`, because what it
 * decides has to already be true of the very first frame: whether the
 * page's load-time animations are held, and whether scrolling is locked,
 * behind a curtain that is about to cover everything.
 *
 * Deferring it to React would mean a frame of un-curtained page — the hero
 * already in place, the corner marks already faded up — before the curtain
 * arrived on top of it.
 *
 * It runs on every document load, which means every reload gets the
 * curtain. It deliberately does NOT run on a route change: this is a
 * module evaluated once per document, and an in-app navigation never
 * reloads it. `PageTransition` owns that gesture instead.
 *
 * It has no imports and no React, so a server component can inline it.
 */

/** Set on `<html>`. Drives the curtain's first paint, the animation hold
 *  and the scroll lock — all in `global.css`. */
export const PRELOADING_ATTR = 'data-preloading';

/**
 * How long the curtain may wait for React before it gives up.
 *
 * The attribute is set here, before any JavaScript bundle has loaded, and
 * only the Preloader's effect ever takes it off. If that effect never runs —
 * a chunk that 404s after a deploy, a module that throws, a browser the
 * bundle cannot run in — the reader was left on blank paper with scrolling
 * locked, for good: the worst failure this site can produce, and the one
 * the route curtain already has a cap for. So the boot script arms its own.
 *
 * 8s is well past the slowest real mount measured (the release lands at
 * 4.1–4.9s on a throttled phone, and the mount is earlier than that), so it
 * never cuts a working curtain short. Once it has fired, the Preloader
 * stands down if it mounts after all, rather than raising a curtain late.
 */
export const PRELOADER_GIVE_UP_MS = 8000;

/** Set on `window` by the Preloader's effect: React made it. */
export const PRELOADER_MOUNTED = '__preloaderMounted';
/** Set on `window` by the boot script when it let go on React's behalf. */
export const PRELOADER_GAVE_UP = '__preloaderGaveUp';

export const PRELOADER_BOOT_SCRIPT = `(function(){var h=document.documentElement;h.setAttribute('${PRELOADING_ATTR}','');setTimeout(function(){if(!window.${PRELOADER_MOUNTED}){window.${PRELOADER_GAVE_UP}=true;h.removeAttribute('${PRELOADING_ATTR}')}},${PRELOADER_GIVE_UP_MS})})()`;
