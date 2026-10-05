import { afterEach, describe, expect, it, vi } from 'vitest';

// The live site shipped `Disallow: /` and an empty sitemap because this
// answer was keyed on a variable Vercel never set (trap 51). It is read at
// module scope, so each case loads a fresh copy of the module.
const load = async (env: Record<string, string | undefined>): Promise<boolean> => {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value as string);
  return (await import('@Constants/envs')).IS_INDEXABLE;
};

describe('IS_INDEXABLE — may search engines index this build?', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('on Vercel, only the production deployment', async () => {
    expect(await load({ VERCEL_ENV: 'production', NEXT_PUBLIC_APP_ENV: undefined })).toBe(true);
    expect(await load({ VERCEL_ENV: 'preview', NEXT_PUBLIC_APP_ENV: 'production' })).toBe(false);
  });

  it('off Vercel, it falls back to NEXT_PUBLIC_APP_ENV, closed by default', async () => {
    expect(await load({ VERCEL_ENV: undefined, NEXT_PUBLIC_APP_ENV: 'production' })).toBe(true);
    expect(await load({ VERCEL_ENV: undefined, NEXT_PUBLIC_APP_ENV: undefined })).toBe(false);
  });
});
