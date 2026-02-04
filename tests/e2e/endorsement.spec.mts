import { test, expect } from '@playwright/test';

test('endorsement flow opens issue draft with prefilled data', async ({
  page,
}) => {
  const owner = process.env.GITHUB_OWNER || 'bitkojine';
  const repo = process.env.GITHUB_REPO || 'cv-site';

  await page.addInitScript(() => {
    const win = window as unknown as { __openedUrl: string | null };
    win.__openedUrl = null;
    window.open = ((url) => {
      win.__openedUrl = String(url || '');
      return null;
    }) as Window['open'];
  });

  await page.goto('/');

  const name = 'E2E Endorser';
  const company = 'Playwright Labs';
  const note = 'Short endorsement from automated test.';

  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Company / Role').fill(company);
  await page.getByLabel('Endorsement (1–3 sentences)').fill(note);

  await page
    .getByRole('button', { name: 'Post Endorsement on GitHub' })
    .click();
  const openedUrl = await page.evaluate(
    () => (window as unknown as { __openedUrl: string | null }).__openedUrl
  );
  expect(openedUrl).toBeTruthy();
  const popupUrl = new URL(openedUrl || '');
  expect(popupUrl.href).toMatch(
    new RegExp(`^https://github\\.com/${owner}/${repo}/issues/new\\?`)
  );
  const titleParam = popupUrl.searchParams.get('title') || '';
  const bodyParam = popupUrl.searchParams.get('body') || '';
  const labelsParam = popupUrl.searchParams.get('labels') || '';

  expect(titleParam).toContain(name);
  expect(titleParam).toContain(company);
  expect(bodyParam).toContain(name);
  expect(bodyParam).toContain(company);
  expect(bodyParam).toContain(note);
  expect(labelsParam).toContain('endorsement');
});
