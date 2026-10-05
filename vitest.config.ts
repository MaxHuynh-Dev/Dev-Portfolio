import path from 'node:path';
import { defineConfig } from 'vitest/config';

const here = (dir: string): string => path.resolve(import.meta.dirname, dir);

/**
 * Unit tests for code that has no business loading the CMS: pure helpers
 * and the two pieces of environment logic that have each shipped a real bug.
 * Browser behaviour is `tests/e2e`, run by Playwright against `next start`.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@Utils': here('src/utils'),
      '@Constants': here('src/constants'),
      '@Hooks': here('src/hooks'),
      '@Components': here('src/components'),
      '@': here('src')
    }
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node'
  }
});
