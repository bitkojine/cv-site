import { test, expect } from '@playwright/test';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const readCacheMessages = async () => {
  const cachePath = path.join(process.cwd(), '.cache', 'github.json');
  const raw = await fs.readFile(cachePath, 'utf-8');
  const payload = JSON.parse(raw) as {
    latestCommits?: Array<{ commit?: { message?: string } }>;
  };
  const messages = payload.latestCommits
    ?.map((commit) => commit.commit?.message?.split('\n')[0] || '')
    .filter(Boolean);
  return messages || [];
};

test('latest commits list renders from live GitHub cache', async ({ page }) => {
  const expectedMessages = await readCacheMessages();
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
});
