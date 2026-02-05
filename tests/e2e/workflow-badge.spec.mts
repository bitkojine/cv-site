import { test, expect } from '@playwright/test';
// Bug: UI badge did not show expected status labels in the DOM.
test('workflow badge shows status label text', async ({ page }) => {
  await page.goto('/test/workflow-badge');

  await expect(page.getByText('Running')).toBeVisible();
  await expect(page.getByText('success')).toBeVisible();
});
