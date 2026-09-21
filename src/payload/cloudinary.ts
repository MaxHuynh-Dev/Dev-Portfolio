import type {
  Adapter,
  GeneratedAdapter,
} from "@payloadcms/plugin-cloud-storage/types";
import { v2 as cloudinary } from "cloudinary";

/**
 * A Cloudinary storage adapter for Payload's own cloud-storage plugin.
 *
 * **Why this is hand-written.** Payload ships first-party adapters for S3,
 * Vercel Blob, Azure, GCS and UploadThing, and none for Cloudinary. The
 * community `payload-cloudinary` package is Payload **2** only — its peer
 * range is `^2.0.0` — so it cannot be used here at all.
 * `@payloadcms/plugin-cloud-storage` is the supported extension point and
 * this is its `Adapter` contract, implemented against the official SDK.
 *
 * **The URL is stored, not reconstructed.** The obvious implementation
 * rebuilds the URL from the public id on every read, and it is wrong the
 * moment Cloudinary normalises a format — upload `a.jpeg` and it serves
 * `a.jpg`, so a reconstructed `.jpeg` URL 404s. `handleUpload` writes the
 * `secure_url` Cloudinary actually returned onto the document and
 * `generateURL` hands that back verbatim. The public id is stored beside it
 * for the same reason: a delete has to address the exact object.
 *
 * Credentials come from `CLOUDINARY_URL`, which the SDK reads by itself —
 * one secret in one variable rather than three that can drift apart.
 */
export const cloudinaryAdapter =
  ({ folder }: { folder: string }): Adapter =>
  ({ prefix }): GeneratedAdapter => {
    /** Where an object lives, with no extension — Cloudinary owns that. */
    const publicIdFor = (filename: string): string => {
      const base = filename.replace(/\.[^/.]+$/, "");
      return [folder, prefix, base].filter(Boolean).join("/");
    };

    return {
      name: "cloudinary",

      // Written onto every Media document. They are `admin.hidden` because
      // they are machinery, not content: an editor has no use for a public
      // id, and a URL they could edit is a URL that can stop matching the
      // object it names.
      fields: [
        {
          name: "cloudinaryURL",
          type: "text",
          admin: { hidden: true },
        },
        {
          name: "cloudinaryPublicId",
          type: "text",
          admin: { hidden: true },
        },
      ],

      handleUpload: async ({ file, data }) => {
        const publicId = publicIdFor(file.filename);

        const uploaded = await new Promise<{
          secure_url: string;
          public_id: string;
        }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              public_id: publicId,
              resource_type: "image",
              // Re-seeding the same four files must not leave orphans, and
              // `invalidate` is what makes the CDN let go of the old bytes
              // rather than serving them until the cache expires.
              overwrite: true,
              invalidate: true,
            },
            (error, result) => {
              if (error !== undefined && error !== null) return reject(error);
              if (result === undefined)
                return reject(new Error("Cloudinary returned no result"));
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            },
          );
          stream.end(file.buffer);
        });

        data.cloudinaryURL = uploaded.secure_url;
        data.cloudinaryPublicId = uploaded.public_id;
        return data;
      },

      handleDelete: async ({ doc, filename }) => {
        // The stored id first, because it is what Cloudinary actually
        // assigned; the derived one only covers a document written before
        // this adapter existed.
        const stored = (doc as unknown as Record<string, unknown>)
          .cloudinaryPublicId;
        const publicId =
          typeof stored === "string" && stored.length > 0
            ? stored
            : publicIdFor(filename);

        await cloudinary.uploader.destroy(publicId, {
          resource_type: "image",
          invalidate: true,
        });
      },

      generateURL: ({ data, filename }) => {
        const stored = (data as { cloudinaryURL?: unknown }).cloudinaryURL;
        if (typeof stored === "string" && stored.length > 0) return stored;
        // Only reached for a document uploaded before this adapter, which
        // has no stored URL to hand back.
        return cloudinary.url(publicIdFor(filename), { secure: true });
      },

      // `disablePayloadAccessControl` means Payload hands out the Cloudinary
      // URL directly and never asks this to serve bytes. It exists because
      // the contract requires it, and it redirects rather than proxying so
      // that if the flag is ever turned off the file still resolves instead
      // of this quietly streaming every image through the Node server.
      staticHandler: (_req, { params }) => {
        const url = cloudinary.url(publicIdFor(params.filename), {
          secure: true,
        });
        return Response.redirect(url, 302);
      },
    };
  };
