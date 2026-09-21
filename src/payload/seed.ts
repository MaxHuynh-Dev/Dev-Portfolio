import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";

import config from "../../payload.config";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const imageDir = path.resolve(dirname, "../../public/images/work");

/**
 * Mock content for a fresh database.
 *
 * What it is NOT: a fixture that runs on every boot. It refuses to touch a
 * database that already has projects or media in it unless `SEED_RESET=1`
 * is set, and says what it found instead. A seed that silently overwrites
 * is a seed that eventually overwrites the real thing.
 *
 * It also creates no user. Payload serves its own create-first-user screen
 * the first time `/admin` is opened against an empty `users` collection,
 * and that is where the password belongs — a credential invented by the
 * script that seeds the database is not a credential.
 *
 * The copy below is the placeholder set that was in `src/content/site.ts`,
 * carried over verbatim so that nothing about the site changed on the day
 * it started reading from the CMS. The one thing that is NOT carried over
 * is the shots' `alt` text: those were all `TODO — describe this shot`,
 * and an alt is the only description a screen reader gets. They were
 * written by looking at the four files.
 */

type SeedShot = { file?: string; tall?: boolean };

type SeedProject = {
  slug: string;
  name: string;
  kind: string;
  year: string;
  summary: string;
  about: string;
  role: string[];
  stack: string[];
  url?: string;
  cover?: string;
  shots: SeedShot[];
};

/** filename → what the image actually shows. */
const MEDIA: Record<string, string> = {
  "hylix-1.png":
    "The Hylix site shown at an angle on pale green, cropped close: the wordmark and the Expertises / Services / Solutions menu above a headline in heavy white caps running off the right edge.",
  "hylix-2.png":
    'The Hylix home page on a dark green ground. "Simplifying IT. Powering the Future." fills the upper half in white caps, with a two-line summary and a pale green Contact us button beneath it, over a field of rectangular blocks that fades in from the lower edge.',
  "soluis-1.png":
    'The Soluis home page over a photoreal render of curved white waterfront apartment towers behind palm trees and turquoise water, with "Building Memories of the Future" set large in a serif at the lower left.',
  "soluis-2.png":
    'The Soluis "What we do" section: an aerial night render of a city drawn as lit points and lines with a river running through it, and a numbered list — Virtual Twin, Immersive Sales Tours, Visual Storytelling, Immersive Activations — where the first is in white and the rest are dimmed.',
};

const PLACEHOLDER_ABOUT =
  "Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built. Two or three sentences is plenty.";

const PROJECTS: SeedProject[] = [
  {
    slug: "hylix",
    name: "Hylix",
    kind: "Category",
    year: "2025",
    summary: "One line on what it is.",
    about: PLACEHOLDER_ABOUT,
    role: ["Front-end build"],
    stack: ["React / Next", "TypeScript"],
    cover: "hylix-2.png",
    shots: [{ file: "hylix-2.png" }, { file: "hylix-1.png" }, {}],
  },
  {
    slug: "soluis",
    name: "Soluis",
    kind: "Category",
    year: "2025",
    summary: "One line on what it is.",
    about:
      "Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.",
    role: ["Front-end build"],
    stack: ["React / Next", "TypeScript"],
    cover: "soluis-1.png",
    shots: [{ file: "soluis-1.png" }, { file: "soluis-2.png" }],
  },
  {
    slug: "project-three",
    name: "Project Three",
    kind: "Category",
    year: "2025",
    summary: "One line on what it is.",
    about:
      "Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.",
    role: ["Front-end build"],
    stack: ["React / Next"],
    shots: [{}, { tall: true }],
  },
  {
    slug: "project-four",
    name: "Project Four",
    kind: "Category",
    year: "2024",
    summary: "One line on what it is.",
    about:
      "Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.",
    role: ["Front-end build"],
    stack: ["React / Next"],
    shots: [{}, {}],
  },
  {
    slug: "project-five",
    name: "Project Five",
    kind: "Category",
    year: "2024",
    summary: "One line on what it is.",
    about:
      "Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.",
    role: ["Front-end build"],
    stack: ["React / Next"],
    shots: [{}, {}],
  },
  {
    slug: "project-six",
    name: "Project Six",
    kind: "Category",
    year: "2023",
    summary: "One line on what it is.",
    about:
      "Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.",
    role: ["Front-end build"],
    stack: ["React / Next"],
    shots: [{}, {}],
  },
  {
    slug: "project-seven",
    name: "Project Seven",
    kind: "Category",
    year: "2023",
    summary: "One line on what it is.",
    about:
      "Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.",
    role: ["Front-end build"],
    stack: ["React / Next"],
    shots: [{}, {}],
  },
  {
    slug: "project-eight",
    name: "Project Eight",
    kind: "Category",
    year: "2022",
    summary: "One line on what it is.",
    about:
      "Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.",
    role: ["Front-end build"],
    stack: ["React / Next"],
    shots: [{}, {}],
  },
];

const PROFILE = {
  firstName: "Max",
  lastName: "Huynh",
  role: "Front-end Engineer",
  location: "Ho Chi Minh",
  timeZone: "Asia/Ho_Chi_Minh",
  email: "maxhuynh.work@gmail.com",
  availability: "Open to work",
  intro: "I build the interactive half of websites, and I build it to hold up.",
  bio: "Replace this with a short paragraph about how you work, who you work with, and what you are open to.",
};

/**
 * The about page.
 *
 * Instructions, not claims. Every line below says what to put there and
 * none of it says anything about the owner — an about page is the one place
 * where inventing a biography is easiest and worst, so the placeholder
 * refuses to start one. Three paragraphs because the page is composed for
 * three; write fewer and it still reads, write more and it still reads.
 */
const ABOUT = {
  // SHORT. It is set at display size and breaks into its own lines, so a
  // paragraph of instructions here renders as a wall of 80px type — six
  // lines at 1440, measured. The long version of this guidance lives in the
  // field's description in the admin, which is where an editor reads it.
  statement: "Replace this with one sentence on what you do.",
  body: [
    "Replace this with how you work: what you are good at, what you reach for first, and what you will not do. Two or three sentences is plenty.",
    "Then the people and the projects — who you build for, what kind of brief suits you, and what working with you actually looks like from the other side.",
    "And what you are open to now: the kind of work you want next, and how someone should start the conversation.",
  ].join("\n\n"),
  columns: [
    {
      label: "services",
      items: ["Front-end build", "Motion", "Design systems"],
    },
    { label: "stack", items: ["React / Next", "TypeScript", "GSAP"] },
  ],
};

const SITE_SETTINGS = {
  workRange: "2022 — 2026",
  // ONE column. It was two — 'code' and 'elsewhere' — and that split earned
  // its place while these were words in two lists. As marks in one row the
  // labels outnumbered the groups they named, so the grouping went and the
  // row kept the order the two lists had run in.
  contactLinks: [
    {
      label: "social",
      links: [
        { label: "GitHub", href: "https://github.com/MaxHuynh-Dev" },
        { label: "LinkedIn", href: "https://www.linkedin.com/in/maxhuynh-dev" },
        { label: "Facebook", href: "https://www.facebook.com/maxhuynh1204/" },
        { label: "X", href: "https://x.com/LeeDev0805" },
        { label: "Instagram", href: "https://www.instagram.com/maxhuynh__/" },
      ],
    },
  ],
};

async function seed(): Promise<void> {
  // An ENV VAR and not a flag, because `payload run` empties process.argv
  // completely — it strips the script path as well as everything after it,
  // so an argv check here can never be true. This shipped as `--reset` and
  // the escape hatch simply did not exist: the refusal path was tested, the
  // way out of it was not.
  const reset = process.env.SEED_RESET === "1";
  const payload = await getPayload({ config });

  const [existingProjects, existingMedia] = await Promise.all([
    payload.count({ collection: "projects" }),
    payload.count({ collection: "media" }),
  ]);

  if (
    (existingProjects.totalDocs > 0 || existingMedia.totalDocs > 0) &&
    !reset
  ) {
    payload.logger.error(
      `Refusing to seed: the database already holds ${existingProjects.totalDocs} project(s) and ${existingMedia.totalDocs} media item(s). Re-run with SEED_RESET=1 to replace them.`,
    );
    process.exit(1);
  }

  if (reset) {
    payload.logger.info("SEED_RESET=1: clearing projects and media.");
    await payload.delete({
      collection: "projects",
      where: { id: { exists: true } },
    });
    await payload.delete({
      collection: "media",
      where: { id: { exists: true } },
    });
  }

  // Uploaded first, because a project references them by id.
  const mediaIds = new Map<string, string>();
  for (const [filename, alt] of Object.entries(MEDIA)) {
    const doc = await payload.create({
      collection: "media",
      data: { alt },
      filePath: path.join(imageDir, filename),
    });
    mediaIds.set(filename, String(doc.id));
    payload.logger.info(`media: ${filename} → ${doc.width}x${doc.height}`);
  }

  // Sequentially, not in parallel: `orderable` assigns each document its
  // place from the one before it, so the array's order only survives if
  // the writes do.
  for (const project of PROJECTS) {
    await payload.create({
      collection: "projects",
      data: {
        slug: project.slug,
        name: project.name,
        kind: project.kind,
        year: project.year,
        summary: project.summary,
        about: project.about,
        role: project.role,
        stack: project.stack,
        url: project.url ?? null,
        cover:
          project.cover === undefined
            ? null
            : (mediaIds.get(project.cover) ?? null),
        shots: project.shots.map((shot) => ({
          image:
            shot.file === undefined ? null : (mediaIds.get(shot.file) ?? null),
          tall: shot.tall ?? false,
        })),
      },
    });
    payload.logger.info(`project: ${project.slug}`);
  }

  await payload.updateGlobal({ slug: "profile", data: PROFILE });
  await payload.updateGlobal({ slug: "about", data: ABOUT });
  await payload.updateGlobal({ slug: "site-settings", data: SITE_SETTINGS });
  payload.logger.info("globals: profile, about, site-settings");

  payload.logger.info(
    `Seeded ${PROJECTS.length} projects and ${Object.keys(MEDIA).length} images. Open /admin to create the first user.`,
  );
  process.exit(0);
}

await seed();
