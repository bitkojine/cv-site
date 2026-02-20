import { expect, test } from '@playwright/test';

const pagesToCheck = [
    '/',
    '/hiring',
    '/hiring/evidence',
    '/hiring/pack',
    '/build',
    '/vision',
    '/dev',
    '/operating-system',
    '/system-map',
    '/library',
    '/linkedin',
    '/cv',
    '/blog',
    '/blog/bitcoin-vs-usd',
    '/blog/building-with-ai',
    '/blog/choosing-orms',
    '/blog/latest-dotnet-features',
    '/blog/latest-postgresql-features',
    '/blog/stopping-the-zombie-attack',
    '/blog/welcome',
    '/blog/why-i-left-linkedin',
  ] as const,
  viewports = [
    { name: 'iphone-se-portrait', width: 320, height: 568 },
    { name: 'iphone-max-portrait', width: 430, height: 932 },
    { name: 'iphone-se-landscape', width: 568, height: 320 },
    { name: 'iphone-max-landscape', width: 932, height: 430 },
    { name: 'iphone-mini-portrait', width: 375, height: 812 },
    { name: 'iphone-mini-landscape', width: 812, height: 375 },
    { name: 'narrow-portrait', width: 280, height: 653 },
    { name: 'narrow-landscape', width: 653, height: 280 },
  ] as const;

test.describe('mobile layout', () => {
  for (const viewport of viewports) {
    test(`no horizontal overflow on key pages (${viewport.name})`, async ({
      page,
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      for (const path of pagesToCheck) {
        await page.goto(path);
        if (path === '/cv') {
          await expect(page.locator('#main-content')).toBeVisible();
        } else {
          await expect(page.locator('.mail-topbar')).toBeVisible();
        }

        const hasOverflow = await page.evaluate(() => {
          const viewportWidth = window.innerWidth,
            bodyWidth = document.body.scrollWidth,
            rootWidth = document.documentElement.scrollWidth;
          return bodyWidth > viewportWidth + 1 || rootWidth > viewportWidth + 1;
        });

        expect(
          hasOverflow,
          `Expected no horizontal overflow on ${path} for ${viewport.name}`
        ).toBeFalsy();
      }
    });
  }
});
