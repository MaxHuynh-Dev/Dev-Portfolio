/**
 * The owner's drawings as Lottie, and the one way this site reads them.
 *
 * Both files are written by `scripts/typing-lottie.mjs` on ONE canvas, so
 * either can be stacked on the other; any Lottie at these paths plays. The
 * index stacks them (`Typist`), `/about` plays the wave on its own
 * (`Waving`).
 */
export const LOTTIE_TYPING = '/lottie/typing.json';
export const LOTTIE_WAVE = '/lottie/wave.json';

/**
 * The LIGHT player: SVG only, no expressions, which is all a drawn file
 * needs. ~150KB of script, so it is imported when a picture is wanted and
 * never on the preloader's path.
 */
export async function loadPlayer() {
  return (await import('lottie-web/build/player/lottie_light')).default;
}

/** A file's JSON, or null when it cannot be had — a missing picture, never a thrown error. */
export async function fetchJson(src: string): Promise<object | null> {
  try {
    const response = await fetch(src);
    return response.ok ? ((await response.json()) as object) : null;
  } catch {
    return null;
  }
}
