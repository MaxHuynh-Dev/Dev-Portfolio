/**
 * ════════════════════════════════════════════════════════════════════
 *  ALL SITE CONTENT LIVES HERE. Edit this file, nothing else.
 *
 *  Every value below marked TODO is a placeholder. None of it is real,
 *  and none of it was invented about you — swap it for your own details.
 * ════════════════════════════════════════════════════════════════════
 */

/** Accent. Alternates: '#d7ff3e' lime, '#ff5a2b' orange, '#7ba7ff' blue. */
export const ACCENT = '#f2efe9';

export interface Profile {
  /** The hero splits the name across two lines. */
  firstName: string;
  lastName: string;
  role: string;
  location: string;
  /** IANA zone — drives the live clock in the bottom HUD. */
  timeZone: string;
  email: string;
  availability: string;
  availabilityDetail: string;
  intro: string;
  statement: string;
  bio: string;
}

export const PROFILE: Profile = {
  firstName: 'Your', // TODO
  lastName: 'Name', // TODO
  role: 'Front-end engineer', // TODO
  location: 'Hanoi', // TODO
  timeZone: 'Asia/Ho_Chi_Minh', // TODO — must be a valid IANA zone
  email: 'you@example.com', // TODO
  availability: 'Working globally', // TODO
  availabilityDetail: 'Q1 2026 — open', // TODO
  intro:
    'I build the front end of websites — the typography, the motion, the 60fps, the accessibility.', // TODO
  statement:
    'I translate art direction into code without losing the intent — the easing, the kerning, the weight of a transition.', // TODO
  bio: 'Replace this with a short paragraph about how you work, who you work with, and what you are open to.' // TODO
};

export interface MetaColumn {
  label: string;
  items: string[];
}

/**
 * Hero meta columns.
 *
 * NOTE: the source design shipped a "Recognition" column claiming Awwwards,
 * CSSDA and FWA. Those were placeholder claims and are deliberately NOT
 * reproduced here. If you have genuine awards, add a column for them.
 */
export const HERO_META: MetaColumn[] = [
  {
    label: 'Practice',
    items: ['Interface engineering', 'Motion & WebGL'] // TODO
  },
  {
    label: 'Services',
    items: ['Front-end build', 'Design systems', 'Performance'] // TODO
  }
];

export const ABOUT_META: MetaColumn[] = [
  {
    label: 'Services',
    items: ['Front-end build', 'Motion & WebGL', 'Design systems'] // TODO
  },
  {
    label: 'Stack',
    items: ['React / Next', 'TypeScript', 'Three.js / GSAP'] // TODO
  },
  {
    label: 'Numbers',
    items: ['— launches', '— avg. Lighthouse', '— years'] // TODO
  }
];

export interface Project {
  /** Two-digit index shown in the left column. */
  no: string;
  name: string;
  kind: string;
  year: string;
  /** Where the row navigates. Use a real URL or route. */
  href: string;
  /** One line, shown on featured cards only. */
  description?: string;
  /** Public path to the preview image, or null for a styled well. */
  image?: string | null;
}

/** The index list. Add or remove freely — the count label derives from it. */
export const PROJECTS: Project[] = [
  {
    no: '01',
    name: 'Project One',
    kind: 'Category',
    year: '2026',
    href: '#index',
    description: 'One sentence on what the project was and what you built.',
    image: null
  }, // TODO
  {
    no: '02',
    name: 'Project Two',
    kind: 'Category',
    year: '2025',
    href: '#index',
    description: 'One sentence on what the project was and what you built.',
    image: null
  }, // TODO
  { no: '03', name: 'Project Three', kind: 'Category', year: '2025', href: '#index', image: null },
  { no: '04', name: 'Project Four', kind: 'Category', year: '2024', href: '#index', image: null },
  { no: '05', name: 'Project Five', kind: 'Category', year: '2024', href: '#index', image: null },
  { no: '06', name: 'Project Six', kind: 'Category', year: '2023', href: '#index', image: null },
  { no: '07', name: 'Project Seven', kind: 'Category', year: '2023', href: '#index', image: null },
  { no: '08', name: 'Project Eight', kind: 'Category', year: '2022', href: '#index', image: null }
];

/** The two large cards above the marquee — first N of PROJECTS. */
export const FEATURED_COUNT = 2;

export const WORK_RANGE = '2022 — 2026'; // TODO

/** Portrait for the About section. null renders a styled well. */
export const PORTRAIT: string | null = null; // TODO

export const MARQUEE_ITEMS = [
  'Showreel',
  'React',
  'TypeScript',
  'Three.js',
  'GSAP',
  'Next.js',
  'Design systems',
  'Core Web Vitals',
  'Accessibility'
]; // TODO

export interface LinkColumn {
  label: string;
  links: { label: string; href: string }[];
}

export const CONTACT_LINKS: LinkColumn[] = [
  {
    label: 'Code',
    links: [
      { label: 'GitHub', href: 'https://github.com' }, // TODO
      { label: 'CodePen', href: 'https://codepen.io' } // TODO
    ]
  },
  {
    label: 'Elsewhere',
    links: [
      { label: 'LinkedIn', href: 'https://linkedin.com' }, // TODO
      { label: 'X', href: 'https://x.com' } // TODO
    ]
  }
];
