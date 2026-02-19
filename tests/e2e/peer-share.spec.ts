import { expect, test } from '@playwright/test';

const rolePages = [
  {
    path: '/hiring',
    sharedRole: 'Recruiter / Hiring Manager',
  },
  {
    path: '/build',
    sharedRole: 'Founder / Operator',
  },
  {
    path: '/vision',
    sharedRole: 'Investor / Advisor',
  },
] as const;

test.describe('peer share prompt', () => {
  rolePages.forEach(({ path }) => {
    test(`stays hidden for direct visit on ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('[data-peer-share-prompt]')).toBeHidden();
    });
  });

  rolePages.forEach(({ path, sharedRole }) => {
    test(`shows for shared visit and forwards via copy fallback on ${path}`, async ({
      page,
    }) => {
      await page.addInitScript(() => {
        (
          window as typeof window & {
            dataLayer: Record<string, unknown>[];
          }
        ).dataLayer = [];

        Object.defineProperty(navigator, 'share', {
          configurable: true,
          value: undefined,
        });

        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: {
            writeText: async (value: string) => {
              (window as typeof window & { __copied?: string }).__copied =
                value;
            },
          },
        });
      });

      await page.goto(
        `${path}?ref=peer_share&shared_role=${encodeURIComponent(sharedRole)}`
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
      expect(copiedUrl).toContain(
        `shared_role=${encodeURIComponent(sharedRole).replace(/%20/g, '+')}`
      );

      const events = await page.evaluate(
        () =>
          (
            window as typeof window & {
              dataLayer: Record<string, unknown>[];
            }
          ).dataLayer
      ),
       eventNames = events.map((event) => event.event);
      expect(eventNames).toContain('peer_share_prompt_viewed');
      expect(eventNames).toContain('peer_share_forwarded');
    });
  });
});
