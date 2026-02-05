import { test, expect } from '@playwright/test';

test('homepage has title and critical sections', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Software Engineer/);

  // Check for main sections
  await expect(page.getByRole('heading', { name: 'PROFILE' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'CORE SKILLS' })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'EXPERIENCE TIMELINE' })
  ).toBeVisible();

  // Check for no console errors (optional but good practice)
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`Error text: "${msg.text()}"`);
    }
  });
});
