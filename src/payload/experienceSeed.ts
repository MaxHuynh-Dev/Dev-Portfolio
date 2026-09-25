import type { Payload } from 'payload';

/**
 * The positions on the owner's CV, as he wrote them.
 *
 * Unlike the rest of the seed these are NOT placeholders: they are copied
 * from the CV he supplied, dates, titles and bullets as written. Nothing
 * here is inferred — `projects` is left empty because the CV lists its
 * projects separately and does not say which position each one was built
 * in. Link them in the admin if they belong to one.
 */
export const EXPERIENCE = [
  {
    company: 'Autonomous Inc',
    role: 'Front End Developer',
    url: 'https://www.autonomous.ai/',
    start: '2023-05',
    end: null,
    location: 'Ho Chi Minh City',
    responsibilities: [
      'Collaborated with the project manager to track team progress and coordinate task delegation, ensuring timely project delivery.',
      'Developed and maintained responsive landing pages using Next.js, translating design concepts into high-quality code.',
      'Integrated RESTful APIs from the back-end to ensure seamless data flow and dynamic UI updates.',
      'Contributed to smart contract development, collaborating with blockchain engineers to implement Web3 features.'
    ].join('\n'),
    stack: ['Next.js', 'RESTful APIs', 'Web3']
  },
  {
    company: 'HiCAS Ltd',
    role: 'Front End Developer - Intern',
    url: 'https://hicas.vn/',
    start: '2022-06',
    end: '2022-07',
    location: 'Ho Chi Minh City',
    responsibilities: [
      'Assisted in developing responsive layouts for company projects, ensuring accurate implementation of design specifications.',
      'Contributed to UI/UX optimization, helping to improve website usability and visual consistency.',
      'Collaborated with the back-end team to integrate APIs and bind data to the user interface effectively.'
    ].join('\n'),
    stack: []
  }
];

/**
 * Writes the positions into an EMPTY `experience` collection.
 *
 * Its own guard rather than the main seed's, because this collection
 * arrived after the database was already full: the main seed refuses a
 * database with projects in it, and resetting the projects to get a CV in
 * would be the wrong trade. `reset` clears the collection first.
 */
export async function seedExperience(payload: Payload, reset: boolean): Promise<void> {
  const existing = await payload.count({ collection: 'experience' });
  if (existing.totalDocs > 0 && !reset) {
    // The one thing it does to a collection that already has content:
    // fill a company's `url` where it is EMPTY, matched by name. The field
    // arrived after the positions were seeded, and an empty field is not
    // an edit anyone made — a url already set in the admin is never touched.
    for (const position of EXPERIENCE) {
      const { docs } = await payload.find({
        collection: 'experience',
        where: { company: { equals: position.company } },
        limit: 1
      });
      const doc = docs[0];
      if (doc === undefined || (typeof doc.url === 'string' && doc.url.length > 0)) continue;
      await payload.update({ collection: 'experience', id: doc.id, data: { url: position.url } });
      payload.logger.info(`experience: ${position.company} url → ${position.url}`);
    }
    payload.logger.warn(
      `experience: otherwise left alone — it already holds ${existing.totalDocs} position(s). SEED_RESET=1 replaces them.`
    );
    return;
  }
  if (reset) {
    await payload.delete({ collection: 'experience', where: { id: { exists: true } } });
  }
  for (const position of EXPERIENCE) {
    await payload.create({ collection: 'experience', data: position });
    payload.logger.info(`experience: ${position.company}`);
  }
}
