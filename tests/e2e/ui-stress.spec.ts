import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const criticalRoutes = ['/', '/hiring', '/build', '/vision', '/dev', '/blog'];

const viewportProfiles = [
  { name: 'desktop-wide', width: 1728, height: 1117 },
  { name: 'desktop-compact', width: 1280, height: 720 },
  { name: 'tablet-portrait', width: 834, height: 1194 },
  { name: 'tablet-landscape', width: 1194, height: 834 },
  { name: 'mobile-portrait', width: 390, height: 844 },
  { name: 'mobile-landscape', width: 844, height: 390 },
] as const;

const hasHorizontalOverflow = async (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const bodyWidth = document.body.scrollWidth;
    const rootWidth = document.documentElement.scrollWidth;
    return bodyWidth > viewportWidth + 1 || rootWidth > viewportWidth + 1;
  });

test.describe('ui stress', () => {
  for (const viewport of viewportProfiles) {
    test(`layout + interaction matrix (${viewport.name})`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      for (const route of criticalRoutes) {
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await expect(page.locator('.mail-topbar')).toBeVisible();
        await expect(
          page.locator('main').or(page.locator('#main-content')).first()
        ).toBeVisible();

        const overflow = await hasHorizontalOverflow(page);
        expect(overflow, `Unexpected horizontal overflow on ${route}`).toBe(
          false
        );

        const firstButton = page.locator('button, a, input, textarea').first();
        await firstButton.focus();
        await page.keyboard.press('Tab');
      }
    });
  }

  test('chaos navigation + rapid interactions remain stable', async ({
    page,
  }, testInfo) => {
    const pageErrors: string[] = [];
    const severeConsole: string[] = [];

    page.on('pageerror', (err) => pageErrors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (
        text.includes('Failed to load resource') ||
        text.includes('net::ERR_ABORTED') ||
        text.includes('net::ERR_FAILED')
      ) {
        return;
      }
      severeConsole.push(text);
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    for (let i = 0; i < 120; i++) {
      const route = criticalRoutes[i % criticalRoutes.length];
      await page.goto(route, {
        waitUntil: 'domcontentloaded',
        timeout: 6000,
      });

      const inputs = page.locator('input, textarea');
      const inputCount = await inputs.count();
      for (let j = 0; j < Math.min(3, inputCount); j++) {
        await inputs
          .nth(j)
          .fill(`stress-${i}-${j}`)
          .catch(() => {});
      }

      await page.mouse.click(20 + (i % 20) * 40, 70 + ((i * 7) % 420), {
        delay: 5,
      });
      await page.keyboard.press('Tab');
      if (i % 6 === 0) await page.keyboard.press('Enter');
      if (i % 10 === 0) await page.goBack().catch(() => {});
      if (i % 11 === 0) await page.goForward().catch(() => {});
    }

    await testInfo.attach('ui-chaos-errors.json', {
      contentType: 'application/json',
      body: Buffer.from(
        JSON.stringify({ pageErrors, severeConsole }, null, 2),
        'utf8'
      ),
    });

    expect(pageErrors).toEqual([]);
    expect(severeConsole).toEqual([]);
  });

  test('degraded network + offline recovery', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    let requestIndex = 0;
    await context.route('**/*', async (route) => {
      requestIndex += 1;
      const jitter = 250 + (requestIndex % 4) * 50;
      await new Promise((resolve) => setTimeout(resolve, jitter));
      if (requestIndex % 40 === 0) {
        await route.abort('failed');
        return;
      }
      await route.continue();
    });

    const page = await context.newPage();
    let successfulLoads = 0;

    for (const route of criticalRoutes) {
      try {
        await page.goto(route, {
          waitUntil: 'domcontentloaded',
          timeout: 9000,
        });
        await expect(page.locator('.mail-topbar')).toBeVisible();
        successfulLoads++;
      } catch {
        void 0;
      }
    }

    await context.setOffline(true);
    await page.goto('/hiring').catch(() => {});
    await context.setOffline(false);

    await page.goto('/hiring', {
      waitUntil: 'domcontentloaded',
      timeout: 9000,
    });
    await expect(page.locator('.mail-topbar')).toBeVisible();

    expect(successfulLoads).toBeGreaterThanOrEqual(
      Math.max(3, criticalRoutes.length - 2)
    );
    await context.close();
  });

  test('critical accessibility violations are not introduced', async ({
    page,
  }, testInfo) => {
    const criticalFindings: Array<{
      route: string;
      id: string;
      impact: string | null | undefined;
      description: string;
      help: string;
    }> = [];

    for (const route of criticalRoutes) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const results = await new AxeBuilder({ page }).analyze();
      const criticalOnly = results.violations.filter(
        (v) => v.impact === 'critical'
      );

      for (const violation of criticalOnly) {
        criticalFindings.push({
          route,
          id: violation.id,
          impact: violation.impact,
          description: violation.description,
          help: violation.help,
        });
      }
    }

    await testInfo.attach('axe-critical-findings.json', {
      contentType: 'application/json',
      body: Buffer.from(JSON.stringify(criticalFindings, null, 2), 'utf8'),
    });

    expect(criticalFindings).toEqual([]);
  });
});
