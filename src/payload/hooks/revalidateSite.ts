import { revalidatePath } from 'next/cache';
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
  PayloadRequest
} from 'payload';

/**
 * A save in `/admin` goes live without a rebuild.
 *
 * Every page on this site is statically generated from the database, so
 * before this a CMS edit sat in Mongo until the next `next build` — which
 * on production meant a redeploy for a changed comma. This marks the whole
 * site stale instead, and each page re-renders from the database on its
 * next visit.
 *
 * **The WHOLE site, not the page the document appears on.** Working out
 * which pages a document reaches is a dependency graph this file would have
 * to keep in step with the components by hand, and it is wider than it
 * looks: the profile is in the corner marks and the metadata of every page;
 * a project is on `/works`, on its own page and on the page BEFORE it, as
 * the next-project link; an image's alt is on whichever of those carry it.
 * Missing one edge leaves a page quietly stale. The site is a handful of
 * pages and a regeneration costs one visit, so the answer that cannot be
 * wrong wins.
 *
 * `'/'` with `'layout'` is the root layout, and every page is beneath it —
 * both route groups included. The admin is dynamic already and does not
 * mind.
 *
 * **It never fails a save.** `revalidatePath` only works inside a Next
 * request, and this also runs from `payload run` — the seed, a one-off
 * script — where it throws. The document has already been written by the
 * time an after-hook runs, so letting that throw would report a failed
 * save that in fact succeeded. It is logged instead.
 *
 * Drag-reordering the projects in the admin goes through `payload.update`
 * one document at a time, so a new order revalidates the same way an edit
 * does.
 */
const revalidateSite = (req: PayloadRequest, what: string): void => {
  try {
    revalidatePath('/', 'layout');
  } catch (error) {
    req.payload.logger.warn(
      `revalidateSite: ${what} changed outside a Next request, so no page was revalidated (${error instanceof Error ? error.message : String(error)}).`
    );
  }
};

export const revalidateAfterChange: CollectionAfterChangeHook = ({ collection, doc, req }) => {
  revalidateSite(req, collection.slug);
  return doc;
};

export const revalidateAfterDelete: CollectionAfterDeleteHook = ({ collection, doc, req }) => {
  revalidateSite(req, collection.slug);
  return doc;
};

export const revalidateGlobalAfterChange: GlobalAfterChangeHook = ({ doc, global, req }) => {
  revalidateSite(req, global.slug);
  return doc;
};
