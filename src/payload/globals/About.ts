import type { GlobalConfig } from "payload";

/**
 * The about page.
 *
 * It was a band at the foot of the index carrying one paragraph and two
 * short lists. As a page of its own that is not enough to read, so the
 * content is modelled properly here — a statement, prose in as many
 * paragraphs as it takes, a portrait, and the columns that used to live in
 * `site-settings` as `aboutMeta`.
 *
 * **Every field ships as a placeholder that says so.** None of it is
 * invented: this site does not put words in its owner's mouth, and an
 * about page is the one place where that temptation is strongest. What the
 * page guarantees is that the composition is correct before the words are
 * real — the same promise `Shot` makes about an image that has not arrived.
 */
export const About: GlobalConfig = {
  slug: "about",
  admin: {
    description: "The /about page. Everything on it, in the order it is read.",
  },
  fields: [
    {
      name: "statement",
      type: "textarea",
      required: true,
      admin: {
        description:
          "The largest line on the page, and the first thing read. One sentence — it is set at display size and a paragraph will not fit.",
      },
    },
    {
      name: "body",
      type: "textarea",
      required: true,
      admin: {
        description:
          "The prose. Separate paragraphs with a BLANK LINE — each one is measured and masked line by line, so plain text only.",
      },
    },
    {
      name: "portrait",
      type: "upload",
      relationTo: "media",
      admin: {
        description:
          "Optional, and empty is a correct state rather than a broken one — the page renders a labelled field and its rhythm is unchanged. Only ever your own photograph: a stock portrait is a claim about what you look like.",
      },
    },
    {
      name: "columns",
      type: "array",
      label: "Columns",
      admin: {
        description:
          "The short lists beside the prose — what you do, what you work with. This is where an awards list would go, and does not: add a column only for something that is true.",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          admin: {
            description: "Lowercase — the site sets no all-caps labels.",
          },
        },
        { name: "items", type: "text", hasMany: true, required: true },
      ],
    },
  ],
};
