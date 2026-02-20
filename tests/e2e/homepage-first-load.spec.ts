import { expect, test } from '@playwright/test';

const ctaName = 'I want to see this Website System',
  maxFirstLoadMs = Number(process.env.HOMEPAGE_FIRST_LOAD_MAX_MS ?? '10000');

test('homepage first load to Website System CTA is within threshold on clean slate', async ({
  baseURL,
  browser,
}, testInfo) => {
  test.setTimeout(30_000);

  const resolvedBaseUrl = baseURL ?? 'http://127.0.0.1:4321',
    homeUrl = new URL('/', resolvedBaseUrl).toString(),
    context = await browser.newContext({ serviceWorkers: 'block' });

  await context.route('**/*', async (route) => {
    const headers = {
      ...route.request().headers(),
      'cache-control': 'no-cache, no-store, max-age=0',
      pragma: 'no-cache',
      expires: '0',
    };
    await route.continue({ headers });
  });

  const page = await context.newPage(),
    session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.setCacheDisabled', { cacheDisabled: true });

  const startedAt = Date.now();
  await page.goto(homeUrl, { waitUntil: 'domcontentloaded' });

  const websiteSystemCta = page.getByRole('link', { name: ctaName });
  await expect(websiteSystemCta).toBeVisible();

  const elapsedMs = Date.now() - startedAt;

  await testInfo.attach('homepage-first-load.json', {
    contentType: 'application/json',
    body: Buffer.from(
      JSON.stringify(
        {
          homeUrl,
          ctaName,
          elapsedMs,
          maxFirstLoadMs,
        },
        null,
        2
      ),
      'utf8'
    ),
  });

  expect(elapsedMs).toBeLessThanOrEqual(maxFirstLoadMs);
  await context.close();
});
