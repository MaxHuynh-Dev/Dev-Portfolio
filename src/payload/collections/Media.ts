import type { CollectionConfig } from 'payload';

import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateSite';

/**
 * Project imagery.
 *
 * **Stored on Cloudinary**, via the adapter in `src/payload/cloudinary.ts`.
 * Payload hands out the Cloudinary URL directly rather than proxying bytes
 * through `/api/media/file/*`, so a page fetches its images from a CDN in
 * one hop. `src/content/source.ts` reads that URL off the document.
 *
 * It used to be `public/media` on local disk, and that had to change before
 * this could deploy anywhere: a serverless filesystem is thrown away at the
 * end of the request, so every upload made in production would have
 * vanished by the time anyone asked for it.
 *
 * **`alt` is required, and that is a content rule rather than a nicety.**
 * It is the only description a screen reader gets for a shot, and the one
 * thing a placeholder can never stand in for. Payload still records `width`
 * and `height` — sharp reads them off the buffer BEFORE the storage adapter
 * runs — which is what lets a shot be laid out at its own proportions
 * before the file has arrived (trap 27).
 */
export const Media: CollectionConfig = {
  slug: 'media',
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete]
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'width', 'height']
  },
  upload: {
    // No `staticDir`: nothing is written to this filesystem. The plugin's
    // `disableLocalStorage` is what enforces that; this is just the absence
    // of a second opinion about where files go.
    mimeTypes: ['image/*'],
    // No generated sizes: next/image already resizes on demand from the
    // original, and a second set of derivatives would be a second answer
    // to the same question. Cloudinary could transform on the fly as well,
    // which would be a third.
    imageSizes: [],
    // The document's own URL, which the adapter stored at upload time. A
    // path built here would be a second guess at where the object lives.
    adminThumbnail: ({ doc }) => (typeof doc.url === 'string' ? doc.url : null)
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
