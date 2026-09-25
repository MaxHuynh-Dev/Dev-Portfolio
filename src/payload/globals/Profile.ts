import type { GlobalConfig } from 'payload';

import { revalidateGlobalAfterChange } from '../hooks/revalidateSite';

/**
 * Who the site is about.
 *
 * A global rather than a collection because there is exactly one of it,
 * and the difference matters downstream: `src/constants/metadata.ts`
 * reads this on the server metadata path, where "the first row, if there
 * is one" would be a silent failure mode.
 *
 * Two fields here are load-bearing beyond their text:
 *
 * - **`timeZone` drives the live clock in the corner marks**, so it is
 *   validated against the platform's own zone table rather than trusted.
 *   A typo there does not read as a typo — it reads as a broken clock.
 * - **`firstName` + `lastName` is the string the entry curtain assembles
 *   letter by letter and hands to the masthead**, exact to the pixel. The
 *   two are built from this one value in both places, which is what lets
 *   the handover be a coincidence by construction rather than by timing.
 */
export const Profile: GlobalConfig = {
  slug: 'profile',
  hooks: { afterChange: [revalidateGlobalAfterChange] },
  admin: {
    description: 'The person. Read by the masthead, the corner marks and the page metadata.'
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'firstName',
          type: 'text',
          required: true,
          admin: { width: '50%' }
        },
        {
          name: 'lastName',
          type: 'text',
          required: true,
          admin: { width: '50%' }
        }
      ]
    },
    {
      type: 'row',
      fields: [
        { name: 'role', type: 'text', required: true, admin: { width: '50%' } },
        {
          name: 'location',
          type: 'text',
          required: true,
          admin: { width: '50%' }
        }
      ]
    },
    {
      name: 'timeZone',
      type: 'text',
      required: true,
      defaultValue: 'Asia/Ho_Chi_Minh',
      admin: {
        description: 'An IANA zone — e.g. Asia/Ho_Chi_Minh. Drives the clock in the corner marks.'
      },
      validate: (value: string | null | undefined) => {
        if (typeof value !== 'string' || value.length === 0) return 'A time zone is required.';
        try {
          // The platform's own table, asked directly. A zone this throws on
          // is a zone the corner clock would throw on too.
          new Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date());
          return true;
        } catch {
          return `"${value}" is not a time zone this runtime knows.`;
        }
      }
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
          admin: { width: '50%' }
        },
        {
          name: 'availability',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
            description: 'e.g. Open to work. Set lowercase in the corner.'
          }
        }
      ]
    },
    {
      name: 'cv',
      type: 'text',
      admin: {
        description:
          'A public link to your CV — a PDF on Google Drive, Dropbox, or under /public. Leave empty and every cv link on the site disappears.'
      },
      // A link rather than an upload, and that is the Cloudinary account
      // talking: a free account refuses to DELIVER PDFs until support turns
      // it on, so an uploaded CV would be a link that 401s. `Media` is also
      // images only, with a required `alt` that means nothing for a PDF.
      validate: (value: string | null | undefined) => {
        if (value === null || value === undefined || value === '') return true;
        if (value.startsWith('/') || /^https?:\/\//.test(value)) return true;
        return 'A full https:// address, or a path under /public starting with /.';
      }
    },
    {
      name: 'intro',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'The line under the masthead, and the site description. Split into measured lines, so plain text only.'
      }
    },
    {
      name: 'bio',
      type: 'textarea',
      required: true,
      admin: { description: 'The paragraph in About. Plain text.' }
    }
  ]
};
