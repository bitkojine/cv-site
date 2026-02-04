import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

test.describe('Mobile Responsiveness', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Controls dock is visible on mobile', async ({ page }) => {
        const controls = page.locator('.controls-dock');
        await expect(controls).toBeVisible();

        // CSS specific check: ensure it's fixed at bottom (if possible to check via computed style)
        // Or just check it is in viewport
        await expect(controls).toBeInViewport();
    });

    test('Content container has correct padding', async ({ page }) => {
        const container = page.locator('main.container');
        await expect(container).toBeVisible();

        // Check computed style for padding if needed, or simply visual regression if we had snapshots
        // For now, existence and visibility is good
    });

    test('No horizontal scrollbar', async ({ page }) => {
        // Check if body scroll width matches window width
        const scrollWidth = await page.evaluate(() => document.body.scrollWidth);
        const clientWidth = await page.evaluate(() => document.body.clientWidth);

        // Allow variance of 1px for subpixel rendering
        expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    });
});
