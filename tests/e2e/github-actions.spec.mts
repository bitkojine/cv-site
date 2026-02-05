import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const readCacheRuns = async () => {
  const cachePath = path.join(process.cwd(), '.cache', 'github.json');
  const raw = await fs.readFile(cachePath, 'utf-8');
  const payload = JSON.parse(raw) as {
    latestWorkflowRuns?: Array<{
      name?: string;
      status?: string;
      conclusion?: string | null;
    }>;
  };
  return payload.latestWorkflowRuns || [];
};

// Bug: Workflow status badges did not update after deploy and showed stale data.
test('workflow status badges render from live GitHub cache', async ({
  page,
}) => {
  const expectedRuns = await readCacheRuns();
  expect(expectedRuns.length).toBeGreaterThan(0);

  await page.goto('/');

  const actionsSection = page.locator('#github-actions-container');
  const workflowLinks = actionsSection.locator('a.workflow-status-link');

  await expect(workflowLinks).toHaveCount(expectedRuns.length);

  for (let index = 0; index < expectedRuns.length; index += 1) {
    const run = expectedRuns[index];
    const expectedName = run.name || '';
    if (expectedName) {
      await expect(workflowLinks.nth(index)).toContainText(expectedName);
    }
  }

  await expect(actionsSection.getByText('View Build Status')).toHaveCount(0);
});
