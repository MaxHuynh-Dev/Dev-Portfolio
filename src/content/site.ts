/**
 * ════════════════════════════════════════════════════════════════════
 *  ALL SITE CONTENT LIVES HERE. Edit this file, nothing else.
 *
 *  Every value below marked TODO is a placeholder. None of it is real,
 *  and none of it was invented about you — swap it for your own details.
 *
 *  Plain data, no imports. src/constants/common.ts reads this file on the
 *  server metadata path, so a single import of anything browser-only here
 *  breaks `next build`.
 * ════════════════════════════════════════════════════════════════════
 */

export interface Profile {
  firstName: string;
  lastName: string;
  role: string;
  location: string;
  /** IANA zone — drives the live clock in the corner marks. */
  timeZone: string;
  email: string;
  availability: string;
  intro: string;
  bio: string;
}

export const PROFILE: Profile = {
  firstName: 'Max', // TODO
  lastName: 'Huynh', // TODO
  role: 'Front-end Engineer', // TODO
  location: 'Ho Chi Minh', // TODO
  timeZone: 'Asia/Ho_Chi_Minh', // TODO — must be a valid IANA zone
  email: 'maxhuynh.work@gmail.com', // TODO
  availability: 'Open to work', // TODO
  intro: 'I build the interactive half of websites, and I build it to hold up.', // TODO
  bio: 'Replace this with a short paragraph about how you work, who you work with, and what you are open to.' // TODO
};

export interface Shot {
  /**
   * A path under /images/work, or null.
   *
   * null is not a broken state: it renders a sized, labelled field so the
   * page's rhythm is correct before the screenshots exist. Drop a file in
   * and set this; nothing else has to change.
   */
  src: string | null;
  /**
   * What the shot actually shows — not "screenshot of the homepage".
   * Required, because it is the only description a screen reader gets.
   */
  alt: string;
  /** A taller crop. Use it once or twice to break the stack's rhythm. */
  tall?: boolean;
}

export interface Project {
  /** The URL segment: /work/<slug>. Lowercase, hyphens, no spaces. */
  slug: string;
  name: string;
  kind: string;
  year: string;
  /** One line. Shown under the preview in the home list. */
  summary: string;
  /** A paragraph. The first thing on the project page. */
  about: string;
  role: string[];
  stack: string[];
  /** The live site. null hides the link rather than pointing at nothing. */
  url: string | null;
  /** The home list's hover preview. null renders the placeholder field. */
  cover: string | null;
  shots: Shot[];
}

/**
 * The work.
 *
 * Deliberately NOT numbered in the list. A numbered marker earns its place
 * when the content is a sequence — a stepped process, a timeline. A set of
 * projects is not one. The counter beside the list IS a sequence, because
 * it reports where in the list you are, and so are the shots on a project
 * page, because they are read in order down the column.
 *
 * NOTE: there is no `recognition` field, on purpose. The design this was
 * modelled on lists Awwwards/CSSDA/FWA there. Add one only if you have
 * awards that are real.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'hylix', // TODO
    name: 'Hylix', // TODO
    kind: 'Category', // TODO
    year: '2025', // TODO
    summary: 'One line on what it is.', // TODO
    about:
      'Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built. Two or three sentences is plenty.', // TODO
    role: ['Front-end build'], // TODO
    stack: ['React / Next', 'TypeScript'], // TODO
    url: null, // TODO — the live site
    cover: '/images/work/hylix-2.png', // TODO — e.g. '/images/work/project-one/cover.jpg'
    shots: [
      { src: '/images/work/hylix-2.png', alt: 'TODO — describe this shot' },
      { src: '/images/work/hylix-1.png', alt: 'TODO — describe this shot' },
      { src: null, alt: 'TODO — describe this shot' }
    ]
  },
  {
    slug: 'project-two', // TODO
    name: 'Project Two',
    kind: 'Category',
    year: '2025',
    summary: 'One line on what it is.',
    about:
      'Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.',
    role: ['Front-end build'],
    stack: ['React / Next', 'TypeScript'],
    url: null,
    cover: null,
    shots: [
      { src: null, alt: 'TODO — describe this shot' },
      { src: null, alt: 'TODO — describe this shot' }
    ]
  },
  {
    slug: 'project-three',
    name: 'Project Three',
    kind: 'Category',
    year: '2025',
    summary: 'One line on what it is.',
    about:
      'Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.',
    role: ['Front-end build'],
    stack: ['React / Next'],
    url: null,
    cover: null,
    shots: [
      { src: null, alt: 'TODO — describe this shot' },
      { src: null, alt: 'TODO — describe this shot', tall: true }
    ]
  },
  {
    slug: 'project-four',
    name: 'Project Four',
    kind: 'Category',
    year: '2024',
    summary: 'One line on what it is.',
    about:
      'Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.',
    role: ['Front-end build'],
    stack: ['React / Next'],
    url: null,
    cover: null,
    shots: [
      { src: null, alt: 'TODO — describe this shot' },
      { src: null, alt: 'TODO — describe this shot' }
    ]
  },
  {
    slug: 'project-five',
    name: 'Project Five',
    kind: 'Category',
    year: '2024',
    summary: 'One line on what it is.',
    about:
      'Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.',
    role: ['Front-end build'],
    stack: ['React / Next'],
    url: null,
    cover: null,
    shots: [
      { src: null, alt: 'TODO — describe this shot' },
      { src: null, alt: 'TODO — describe this shot' }
    ]
  },
  {
    slug: 'project-six',
    name: 'Project Six',
    kind: 'Category',
    year: '2023',
    summary: 'One line on what it is.',
    about:
      'Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.',
    role: ['Front-end build'],
    stack: ['React / Next'],
    url: null,
    cover: null,
    shots: [
      { src: null, alt: 'TODO — describe this shot' },
      { src: null, alt: 'TODO — describe this shot' }
    ]
  },
  {
    slug: 'project-seven',
    name: 'Project Seven',
    kind: 'Category',
    year: '2023',
    summary: 'One line on what it is.',
    about:
      'Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.',
    role: ['Front-end build'],
    stack: ['React / Next'],
    url: null,
    cover: null,
    shots: [
      { src: null, alt: 'TODO — describe this shot' },
      { src: null, alt: 'TODO — describe this shot' }
    ]
  },
  {
    slug: 'project-eight',
    name: 'Project Eight',
    kind: 'Category',
    year: '2022',
    summary: 'One line on what it is.',
    about:
      'Replace this with a short paragraph: what the project was, what you were asked to solve, and what you actually built.',
    role: ['Front-end build'],
    stack: ['React / Next'],
    url: null,
    cover: null,
    shots: [
      { src: null, alt: 'TODO — describe this shot' },
      { src: null, alt: 'TODO — describe this shot' }
    ]
  }
];

export const WORK_RANGE = '2022 — 2026'; // TODO

export interface MetaColumn {
  label: string;
  items: string[];
}

/**
 * NOTE: the source design shipped a "Recognition" column claiming Awwwards,
 * CSSDA and FWA, and a "Numbers" column of em-dash placeholders. Both are
 * deliberately absent. Add a column only for things that are true.
 */
export const ABOUT_META: MetaColumn[] = [
  {
    label: 'services',
    items: ['Front-end build', 'Motion', 'Design systems'] // TODO
  },
  {
    label: 'stack',
    items: ['React / Next', 'TypeScript', 'GSAP'] // TODO
  }
];

export interface LinkColumn {
  label: string;
  links: { label: string; href: string }[];
}

export const CONTACT_LINKS: LinkColumn[] = [
  {
    label: 'code',
    links: [
      { label: 'GitHub', href: 'https://github.com/MaxHuynh-Dev' }, // TODO
      { label: 'CodePen', href: 'https://codepen.io' } // TODO
    ]
  },
  {
    label: 'elsewhere',
    links: [
      { label: 'LinkedIn', href: 'www.linkedin.com/in/maxhuynh-dev' }, // TODO
      { label: 'Facebook', href: 'https://www.facebook.com/maxhuynh1204/' }, // TODO
      { label: 'X', href: 'https://x.com/LeeDev0805' }, // TODO
      { label: 'Instagram', href: 'https://www.instagram.com/maxhuynh__/' } // TODO
    ]
  }
];

/**
 * The colophon — one quiet line at the foot of the page.
 *
 * Every claim here is checkable against package.json and the source. Do not
 * add anything that is not: a colophon that overstates is worse than none,
 * and this page already refuses to invent awards or metrics.
 */
export const COLOPHON =
  'Set in Nippo and Switzer, self-hosted. Built with Next.js 16 and React 19, ' +
  'scroll smoothed by Lenis, motion by GSAP. The name in the masthead is measured ' +
  'and fitted to its column at run time rather than sized by a fixed scale.';
