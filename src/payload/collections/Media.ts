import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CollectionConfig } from 'payload';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Project imagery.
 *
 * Stored under `public/media`, so Next serves the file directly at
 * `/media/<filename>` and an image never has to travel through a Payload
 * route to reach the page. `src/content/source.ts` builds that path; the
 * `url` Payload reports (`/api/media/file/...`) is left for the admin UI.
 *
 * **`alt` is required, and that is a content rule rather than a nicety.**
 * It is the only description a screen reader gets for a shot, and the one
 * thing a placeholder can never stand in for. Payload records `width` and
 * `height` on upload, which is what lets a shot be laid out at its own
 * proportions before the file has arrived (trap 27).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'width', 'height']
  },
  upload: {
    staticDir: path.resolve(dirname, '../../../public/media'),
    mimeTypes: ['image/*'],
    // No generated sizes: next/image already resizes on demand from the
    // original, and a second set of derivatives would be a second answer
    // to the same question.
    imageSizes: [],
    adminThumbnail: ({ doc }) => `/media/${String(doc.filename)}`
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'What the image actually shows — not "screenshot of the homepage". This is the only description a screen reader gets.'
      }
    }
  ]
};
