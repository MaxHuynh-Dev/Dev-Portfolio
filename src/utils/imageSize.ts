import { join } from 'node:path';
import sharp from 'sharp';

/**
 * A picture's real proportions, read off the file itself.
 *
 * SERVER ONLY. `sharp` is in Next's own `serverExternalPackages` list, so
 * it is required at runtime rather than bundled — importing this from a
 * client component would try to send a native module to the browser.
 *
 * It exists so that a shot can be shown at its own shape instead of being
 * cropped into a declared one, WITHOUT the page having to wait for the
 * image to arrive before it knows how tall it is. Those two have to come
 * together here: the project page measures where every shot's centre falls
 * to place the thumbnail rail's marker, and a stack that grows under the
 * reader as each file lands would move every one of those centres.
 *
 * So the ratio is settled on the server. The pages are statically
 * generated (`dynamicParams = false`), which makes this a build-time read
 * of four files, not a request-time one.
 *
 * The alternative was writing the dimensions into `src/content/site.ts`
 * beside each shot. That file's promise is "drop a file in, set `src`, and
 * nothing else has to change" — and a hand-typed height is exactly the
 * kind of thing that goes stale the first time an image is re-exported.
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * One read per path per process.
 *
 * Eight project pages are generated in the same build and several of them
 * can point at the same file — a cover that is also the first shot, for
 * one. `null` is cached as firmly as a size is: a missing file is not
 * worth asking about eight times.
 */
const measured = new Map<string, Size | null>();

/**
 * The file's own width and height, or null when there is nothing to
 * measure — no image at all, or a remote one, whose bytes are not ours to
 * open at build time. A null answer is not a failure; the call site falls
 * back to a declared ratio, which is what the empty field uses anyway.
 */
export const sizeOf = async (src: string | null): Promise<Size | null> => {
  if (src === null || !src.startsWith('/')) return null;

  const known = measured.get(src);
  if (known !== undefined) return known;

  let size: Size | null = null;
  try {
    const meta = await sharp(join(process.cwd(), 'public', src)).metadata();
    if (meta.width > 0 && meta.height > 0) size = { width: meta.width, height: meta.height };
  } catch {
    // A shot whose file is missing still has to render — as the labelled
    // field, which is the same thing a null `src` produces. Failing the
    // build over it would mean a typo in a path takes the whole site down.
    size = null;
  }

  measured.set(src, size);
  return size;
};
