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

export const PRELOADER_BOOT_SCRIPT = `document.documentElement.setAttribute('${PRELOADING_ATTR}','')`;
