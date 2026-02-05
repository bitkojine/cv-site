import { test, expect } from '@playwright/test';

test('workflow badge shows mapped status labels', async ({ page }) => {
  await page.goto('/test/workflow-badge');

  await expect(page.getByText('Running')).toBeVisible();
  await expect(page.getByText('success')).toBeVisible();
  await expect(page.getByText('failure')).toBeVisible();
  await expect(page.getByText('Unknown')).toBeVisible();
});

test('workflow badge exposes deterministic status state', async ({ page }) => {
  await page.goto('/test/workflow-badge');

  await expect(page.locator('[data-status="running"]')).toHaveCount(1);
  await expect(page.locator('[data-status="success"]')).toHaveCount(1);
  await expect(page.locator('[data-status="failure"]')).toHaveCount(1);
  await expect(page.locator('[data-status="unknown"]')).toHaveCount(1);
});
