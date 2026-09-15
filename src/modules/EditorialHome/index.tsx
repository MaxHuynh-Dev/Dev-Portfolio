import type React from 'react';

import { About } from './About';
import { Contact } from './Contact';
import { Hero } from './Hero';
import { Marquee } from './Marquee';
import { ProjectIndex } from './ProjectIndex';
import Shell from './Shell';
import { Work } from './Work';

/**
 * Server component. Every section below is static JSX over frozen data and
 * stays on the server; only Shell (reveals, WebGL gate) and ProjectIndex
 * (hover/focus state) cross into the client bundle.
 */
function EditorialHome(): React.ReactElement {
  return (
    <Shell>
      <Hero />
      <Work />
      <Marquee />
      <ProjectIndex />
      <About />
      <Contact />
    </Shell>
  );
}

export default EditorialHome;
