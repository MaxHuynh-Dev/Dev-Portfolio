import type { CollectionConfig } from "payload";

/**
 * Who can edit the site.
 *
 * Auth-enabled and nothing more: this is a one-person portfolio, so there
 * are no roles to model and no access matrix to get wrong. Payload serves
 * its own create-first-user screen at /admin the first time the collection
 * is empty — no account is seeded, because a password written by anything
 * other than the person who owns it is not a credential.
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["name", "email"],
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
