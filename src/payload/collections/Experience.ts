import type { CollectionConfig } from 'payload';

import { revalidateAfterChange, revalidateAfterDelete } from '../hooks/revalidateSite';

/** `YYYY-MM`. Sorts as text in the same order it sorts as a date. */
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Where he has worked, one document per position.
 *
 * **The dates are `YYYY-MM` text, not Payload `date` fields.** A date
 * field stores an instant, and a month picked in the admin in Ho Chi Minh
 * is stored as the previous day in UTC — `2023-05` would come back as
 * April 30th, and the page would print the wrong month. A month is all a
 * CV ever says, so a month is all that is stored. It also sorts: as text,
 * `2023-05` > `2022-06`, so the page reads newest first without an
 * `orderable` drag to keep in step with the calendar.
 *
 * `responsibilities` is ONE textarea, a line per item, for the reason the
 * about page's body is one textarea split on blank lines: each item is
 * measured and masked line by line, so it has to be plain text, and a
 * textarea is the plainest thing the admin has.
 */
export const Experience: CollectionConfig = {
  slug: 'experience',
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateAfterDelete]
  },
  defaultSort: '-start',
  admin: {
    useAsTitle: 'company',
    defaultColumns: ['company', 'role', 'start', 'end'],
    description: 'The /experience page. Newest first, by start month — there is nothing to drag.'
  },
  fields: [
    {
      type: 'row',
      fields: [
        { name: 'company', type: 'text', required: true, admin: { width: '50%' } },
        {
          name: 'role',
          type: 'text',
          required: true,
          admin: {
            width: '50%',
            description: 'As the contract said it — e.g. Front End Developer.'
          }
        }
      ]
    },
    {
      type: 'row',
      fields: [
        {
          name: 'start',
          type: 'text',
          required: true,
          index: true,
          admin: { width: '33%', description: 'YYYY-MM — e.g. 2023-05.' },
          validate: (value: string | null | undefined) =>
            typeof value === 'string' && MONTH.test(value) ? true : 'A month as YYYY-MM.'
        },
        {
          name: 'end',
          type: 'text',
          admin: { width: '33%', description: 'YYYY-MM. Empty means you are still there.' },
          validate: (value: string | null | undefined) =>
            value === null || value === undefined || value === '' || MONTH.test(value)
              ? true
              : 'A month as YYYY-MM, or empty.'
        },
        { name: 'location', type: 'text', admin: { width: '34%' } }
      ]
    },
    {
      name: 'responsibilities',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'ONE ITEM PER LINE. Each is split into its own measured lines on the page, so plain text only.'
      }
    },
    {
      name: 'stack',
      type: 'text',
      hasMany: true,
      admin: { description: 'Optional. What the work was done in.' }
    },
    {
      name: 'projects',
      type: 'relationship',
      relationTo: 'projects',
      hasMany: true,
      admin: {
        description:
          'Optional. Projects built in this position — each links to its own page. Only add one that really was.'
      }
    }
  ]
};
