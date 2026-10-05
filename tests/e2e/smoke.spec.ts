import { expect, type Page, test } from '@playwright/test';

/**
 * The invariants CLAUDE.md verifies by hand, checked on every run:
 * - both curtains always let go;
 * - a navigation lands at the top with focus on the content;
 * - no page scrolls sideways;
 * - an unknown address is the site's own 404.
 */

const PAGES = ['/', '/works', '/about', '/experience'];
const NOT_FOUND = 'Nothing lives at this address.';

const firstProject = async (page: Page): Promise<string> => {
  const html = await (await page.request.get('/works')).text();
  const slug = html.match(/href="(\/work\/[^"]+)"/)?.[1];
  if (slug === undefined) throw new Error('No project link on /works');
  return slug;
};

const letGo = async (page: Page): Promise<void> => {
  await expect(page.locator('html')).not.toHaveAttribute('data-preloading', /.*/, {
    timeout: 8_000
  });
};

test('every page answers, and an unknown address is a styled 404', async ({ page }) => {
  for (const path of [...PAGES, await firstProject(page)]) {
    expect((await page.request.get(path)).status(), path).toBe(200);
  }

  for (const path of ['/work/not-a-project', '/no-such-page']) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(NOT_FOUND);
  }

  // The CMS's REST API is not public.
  expect((await page.request.get('/api/projects')).status()).toBe(403);
});

for (const width of [375, 1440]) {
  test(`the entry curtain lets go and nothing scrolls sideways at ${width}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.setViewportSize({ width, height: 800 });

    for (const path of [...PAGES, await firstProject(page)]) {
      await page.goto(path);
      await letGo(page);
      const sideways = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      expect(sideways, path).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });
}

test('a route change lets go, lands at the top and moves focus to the content', async ({
  page
}) => {
  await page.goto('/experience');
  await letGo(page);
  await page.mouse.wheel(0, 600);

  await page.locator('a[href="/works"]').first().click();
  await page.waitForURL('**/works');
  await expect(page.locator('html')).not.toHaveAttribute('data-routing', /.*/, {
    timeout: 8_000
  });

  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await page.evaluate(() => document.activeElement?.id)).toBe('content');
});
