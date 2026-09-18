import type { GlobalConfig } from 'payload';

/**
 * Everything on the index that is not a project and not the person.
 *
 * The three lists here are the ones the source design used to fill with
 * claims: a "Recognition" column of awards and a "Numbers" column of
 * em-dash placeholders. Both are absent, and `aboutMeta` is a free list
 * precisely so a column is added only when there is something true to put
 * in it — rather than a fixed `awards` field sitting empty, asking to be
 * filled.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: {
    description: 'The work range, the About and Contact columns, and the colophon.'
  },
  fields: [
    {
      name: 'workRange',
      type: 'text',
      required: true,
      admin: {
        description: 'Shown beside the work list and in the /works description — e.g. 2022 — 2026.'
      }
    },
    {
      name: 'aboutMeta',
      type: 'array',
      label: 'About columns',
      admin: {
        description:
          'The short lists beside the bio. Add a column only for something that is true — this is where an awards list would go, and does not.'
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'Lowercase — the site sets no all-caps labels.' }
        },
        { name: 'items', type: 'text', hasMany: true, required: true }
      ]
    },
    {
      name: 'contactLinks',
      type: 'array',
      label: 'Contact columns',
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'links',
          type: 'array',
          required: true,
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
                { name: 'href', type: 'text', required: true, admin: { width: '60%' } }
              ]
            }
          ]
        }
      ]
    },
    {
      name: 'colophon',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'One quiet line at the foot of the page. Every claim in it should be checkable against the source — a colophon that overstates is worse than none.'
      }
    }
  ]
};
