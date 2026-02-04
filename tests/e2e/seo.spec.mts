import { test, expect } from '@playwright/test';

test.describe('SEO Checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Page has correct title', async ({ page }) => {
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
    // Based on index.astro: title={`${personalInfo.name} - ${personalInfo.title}`}
    // We might not know exact name, but checks structure if possible, or just presence.
  });

  test('Page has meta description', async ({ page }) => {
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
    const content = await description.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content?.length).toBeGreaterThan(10);
  });

  test('Page has Open Graph tags', async ({ page }) => {
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDesc = page.locator('meta[property="og:description"]');
    const ogType = page.locator('meta[property="og:type"]');
    const ogUrl = page.locator('meta[property="og:url"]');

    await expect(ogTitle).toHaveCount(1);
    await expect(ogDesc).toHaveCount(1);
    await expect(ogType).toHaveCount(1);
    await expect(ogUrl).toHaveCount(1);

    await expect(ogType).toHaveAttribute('content', 'profile');
  });

  test('Page has viewport meta tag', async ({ page }) => {
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveCount(1);
  });

  test('Page has canonical link', async ({ page }) => {
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveCount(1);
  });
});
