/**
 * The pre-paint half of the preloader.
 *
 * This ships as a blocking inline script in `<head>`, because both of the
 * decisions it makes have to already be true of the very first frame:
 *
 *   - whether the curtain shows at all (once per session), and
 *   - whether the page's load-time animations are held behind it.
 *
 * Deferring either to React would mean a frame of un-curtained page for a
 * repeat visitor, and a frame of hero animation for everyone else.
 *
 * It has no imports and no React, so a server component can inline it.
 */

/** Set on `<html>`. Drives the curtain's first paint, the animation hold
 *  and the scroll lock — all in `global.css`. */
export const PRELOADING_ATTR = 'data-preloading';

/** Written once the curtain has finished, so it runs once per session. */
export const PRELOAD_SESSION_KEY = 'ed:preloaded';

/**
 * Note the failure mode: if `sessionStorage` throws — Safari private mode
 * has historically done this — `seen` stays 0 and the curtain shows. An
 * extra curtain is a better outcome than a silently broken page, which is
 * what suppressing it on error would eventually produce.
 */
export const PRELOADER_BOOT_SCRIPT =
  `(function(){var s=0;try{s=sessionStorage.getItem('${PRELOAD_SESSION_KEY}')?1:0}catch(e){}` +
  `if(!s)document.documentElement.setAttribute('${PRELOADING_ATTR}','')})()`;
