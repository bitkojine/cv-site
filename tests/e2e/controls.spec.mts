import { test, expect } from '@playwright/test';

test.describe('Controls Dock Coverage', () => {
  test('Controls dock renders on the CV page', async ({ page }) => {
    await page.goto('/');

    const dock = page.locator('.controls-dock');
    await expect(dock).toBeVisible();
    await expect(dock).toHaveCount(1);

    await expect(
      page.getByRole('button', { name: /Toggle dark mode/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Download CV as PDF/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /Share CV/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Read my blog/i })
    ).toBeVisible();
  });

  const nonCvRoutes = ['/blog', '/blog/welcome'];

  for (const route of nonCvRoutes) {
    test(`Controls dock renders on ${route}`, async ({ page }) => {
      await page.goto(route);

      const dock = page.locator('.controls-dock');
      await expect(dock).toBeVisible();
      await expect(dock).toHaveCount(1);

      await expect(
        page.getByRole('button', { name: /Toggle dark mode/i })
      ).toBeVisible();
      await expect(
        dock.getByRole('link', { name: /Back to CV/i })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Share CV/i })
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: /Read my blog/i })
      ).toBeVisible();
    });
  }
});
