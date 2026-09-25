import { getPayload } from 'payload';

import config from '../../payload.config';
import { seedExperience } from './experienceSeed';

/**
 * `yarn seed:experience` — the CV's positions, into a database that
 * already has everything else. Leaves a non-empty collection alone unless
 * SEED_RESET=1 (an env var, because `payload run` empties argv — trap 37).
 */
const payload = await getPayload({ config });
await seedExperience(payload, process.env.SEED_RESET === '1');
process.exit(0);
