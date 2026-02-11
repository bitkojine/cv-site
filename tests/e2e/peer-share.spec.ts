import { expect, test } from '@playwright/test';

test.describe('peer share prompt', () => {
  test('stays hidden for direct visits', async ({ page }) => {
    await page.goto('/hiring');
    await expect(page.locator('[data-peer-share-prompt]')).toBeHidden();
  });

  test('shows for shared visits and forwards via copy fallback', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (
        window as typeof window & { dataLayer: Array<Record<string, unknown>> }
      ).dataLayer = [];

      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: undefined,
      });

      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (value: string) => {
            (window as typeof window & { __copied?: string }).__copied = value;
          },
        },
      });
    });

    await page.goto(
      '/build?ref=peer_share&shared_role=Founder%20%2F%20Operator'
    );

    const prompt = page.locator('[data-peer-share-prompt]');
    await expect(prompt).toBeVisible();

    await page.getByRole('button', { name: 'Forward profile' }).click();
    await expect(page.locator('[data-peer-share-forward-label]')).toHaveText(
      'Link copied'
    );

    const copiedUrl = await page.evaluate(
      () => (window as typeof window & { __copied?: string }).__copied
    );
    expect(copiedUrl).toContain('ref=peer_share');
    expect(copiedUrl).toContain('shared_role=Founder+%2F+Operator');

    const events = await page.evaluate(
      () =>
        (
          window as typeof window & {
            dataLayer: Array<Record<string, unknown>>;
          }
        ).dataLayer
    );
    const eventNames = events.map((event) => event.event);
    expect(eventNames).toContain('peer_share_prompt_viewed');
    expect(eventNames).toContain('peer_share_forwarded');
  });
});
