import type { CollectionConfig } from 'payload';

/**
 * The work.
 *
 * `orderable` is what carries the order the site reads the projects in.
 * The list on the index, the ring on /works and `generateStaticParams`
 * all iterate the same array, so the order is content rather than code —
 * Payload adds an `_order` field, sorts by it and gives the admin list a
 * drag handle, which means re-ordering the site is a drag and not a
 * deploy.
 *
 * **There is no `recognition` field, on purpose.** The design this was
 * modelled on lists Awwwards / CSSDA / FWA there, and this site does not
 * carry award claims it cannot stand behind. Adding the field is how the
 * claims get invented; the absence is the guard.
 *
 * `alt` lives on the Media document and not on a shot, so one file has
 * exactly one description. The old shape allowed the same image to be
 * given two different alts in two places, which is one more than can be
 * true.
 */
export const Projects: CollectionConfig = {
  slug: 'projects',
  orderable: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'kind', 'year'],
    description: 'Drag a row to change the order the site reads them in.'
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: { width: '50%' }
        },
        {
          name: 'slug',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          admin: {
            width: '50%',
            description: 'The URL segment: /work/<slug>.'
          },
          validate: (value: string | null | undefined) => {
            if (typeof value !== 'string' || value.length === 0) return 'A slug is required.';
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
              return 'Lowercase letters, numbers and single hyphens only — no spaces.';
            }
            return true;
          }
        }
      ]
    },
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'text',
          required: true,
          admin: { width: '50%', description: 'The category shown beside the name.' }
        },
        {
          name: 'year',
          type: 'text',
          required: true,
          admin: { width: '50%', description: 'Shown as typed — e.g. 2025.' }
        }
      ]
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
      admin: { description: 'One line. Shown under the preview in the home list.' }
    },
    {
      name: 'about',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'A paragraph. The first thing on the project page — it is split into its own measured lines, so plain text only.'
      }
    },
    {
      type: 'row',
      fields: [
        {
          name: 'role',
          type: 'text',
          hasMany: true,
          required: true,
          admin: { width: '50%' }
        },
        {
          name: 'stack',
          type: 'text',
          hasMany: true,
          required: true,
          admin: { width: '50%' }
        }
      ]
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description:
          'The live site. Left empty the link is absent rather than dead — a link with nowhere to go is worse than no link.'
      }
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          "The home list's preview. Left empty it renders the labelled field, which is a correct state and not a broken one."
      }
    },
    {
      name: 'shots',
      type: 'array',
      labels: { singular: 'Shot', plural: 'Shots' },
      admin: {
        description:
          'Down the middle of the project page, in this order. A shot with no image still reserves its place in the stack and in the thumbnail rail.'
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media'
        },
        {
          name: 'tall',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Only shapes the EMPTY field — a real image is always shown at its own proportions. Use it once or twice to break the rhythm of a stack of placeholders.'
          }
        }
      ]
    }
  ]
};
