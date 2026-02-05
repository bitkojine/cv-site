import { test, expect } from '@playwright/test';

const owner = 'bitkojine';
const repo = 'cv-site';

const fetchLatestRuns = async () => {
  const runsUrl = new URL(
    `https://api.github.com/repos/${owner}/${repo}/actions/runs`
  );
  runsUrl.searchParams.set('per_page', '30');
  runsUrl.searchParams.set('branch', 'main');

  const response = await fetch(runsUrl.toString(), {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}`);
  }

  const data = (await response.json()) as {
    workflow_runs?: Array<{ workflow_id: number; name?: string }>;
  };

  const latestRuns = new Map<number, { workflow_id: number; name?: string }>();
  for (const run of data.workflow_runs || []) {
    if (!latestRuns.has(run.workflow_id)) {
      latestRuns.set(run.workflow_id, run);
    }
  }

  return Array.from(latestRuns.values());
};

// Bug: Workflow status badges did not update after deploy and showed stale data.
test(
  'workflow status badges render from live GitHub API',
  { tag: ['@github-api'] },
  async ({ page }) => {
    const expectedRuns = await fetchLatestRuns();
    expect(expectedRuns.length).toBeGreaterThan(0);

    await page.goto('/');

    const actionsSection = page.locator('#github-actions-container');
    const workflowLinks = actionsSection.locator('a.workflow-badge');

    await expect(workflowLinks).toHaveCount(expectedRuns.length);

    for (let index = 0; index < expectedRuns.length; index += 1) {
      const run = expectedRuns[index];
      const expectedName = run.name || '';
      if (expectedName) {
        await expect(workflowLinks.nth(index)).toContainText(expectedName);
      }
    }

    await expect(actionsSection.getByText('View Build Status')).toHaveCount(0);
  }
);
