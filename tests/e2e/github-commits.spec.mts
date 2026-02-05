import { test, expect } from '@playwright/test';

const owner = 'bitkojine';
const repo = 'cv-site';

const fetchLatestCommitMessages = async () => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=5`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error ${response.status}`);
  }

  const data = (await response.json()) as Array<{
    commit?: { message?: string };
  }>;

  return (data || [])
    .map((commit) => commit.commit?.message?.split('\n')[0] || '')
    .filter(Boolean);
};

// Bug: Latest commits list rendered stale/fallback data after deploy.
test(
  'latest commits list renders from live GitHub API',
  { tag: ['@github-api'] },
  async ({ page }) => {
  const expectedMessages = await fetchLatestCommitMessages();
  expect(expectedMessages.length).toBeGreaterThan(0);

  await page.goto('/');

  const commitsSection = page.locator('#github-commits-container');
  await expect(
    commitsSection.getByRole('heading', { name: 'LATEST COMMITS' })
  ).toBeVisible();

  const commitLinks = commitsSection.locator('ul.commits-list li a');
  await expect(commitLinks).toHaveCount(expectedMessages.length);

  for (let index = 0; index < expectedMessages.length; index += 1) {
    await expect(commitLinks.nth(index)).toContainText(expectedMessages[index]);
  }

  await expect(commitsSection.getByText('View on GitHub →')).toHaveCount(0);
  }
);
