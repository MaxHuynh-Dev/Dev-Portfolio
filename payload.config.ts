import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { cloudinaryAdapter } from './src/payload/cloudinary';
import { Media } from './src/payload/collections/Media';
import { Projects } from './src/payload/collections/Projects';
import { Users } from './src/payload/collections/Users';
import { About } from './src/payload/globals/About';
import { Profile } from './src/payload/globals/Profile';
import { SiteSettings } from './src/payload/globals/SiteSettings';

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * ════════════════════════════════════════════════════════════════════
 *  The CMS behind src/content.
 *
 *  Every collection and global below is a one-to-one model of a shape
 *  that already existed in `src/content/site.ts`. That is deliberate:
 *  the read layer in `src/content/source.ts` maps a Payload document
 *  back onto `Profile`, `Project`, `MetaColumn` and `LinkColumn`
 *  unchanged, so nothing downstream of it — the fitting engine, the
 *  ring, the masks — had to learn a second shape.
 *
 *  Three standing content rules from CLAUDE.md are enforced here as
 *  field-level constraints rather than left to good intentions:
 *  `Media.alt` is required, every `shots` row carries its own `alt`,
 *  and there is no `recognition` field on `Projects`.
 * ════════════════════════════════════════════════════════════════════
 */
export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname)
    },
    meta: {
      titleSuffix: '— Portfolio CMS'
    }
  },
  collections: [Projects, Media, Users],
  globals: [Profile, About, SiteSettings],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload/payload-types.ts')
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
    // The URI in .env ends at the host with no path, which would otherwise
    // land every document in Atlas's default `test` database. Naming it
    // here keeps that decision in the repo instead of in a secret.
    connectOptions: {
      dbName: process.env.DATABASE_NAME || 'dev-portfolio'
    }
  }),
  // Already a dependency, and the reason a shot can be laid out at its own
  // proportions: Payload records each upload width and height with it, which
  // is what the page reserves space from before a byte of the file arrives.
  //
  // It runs BEFORE the storage adapter does, which is what lets the files
  // live on Cloudinary without the layout losing anything: the width and
  // height are read off the buffer here and written to the document, so the
  // page still reserves the right box before a byte is fetched (trap 27).
  sharp,
  plugins: [
    cloudStoragePlugin({
      collections: {
        media: {
          adapter: cloudinaryAdapter({
            folder: process.env.CLOUDINARY_FOLDER || 'dev-portfolio'
          }),
          // Nothing is written to public/media any more. Leaving it on would
          // keep a second copy of every image on whatever filesystem the app
          // happens to be running on — which on Vercel is thrown away at the
          // end of the request, and is the whole reason for this plugin.
          disableLocalStorage: true,
          // Payload hands out the Cloudinary URL itself rather than proxying
          // bytes through /api/media/file/*. One hop to a CDN instead of two
          // to a Node process, and it is why next.config.ts has to name
          // res.cloudinary.com as a remote pattern.
          disablePayloadAccessControl: true
        }
      }
    })
  ]
});
