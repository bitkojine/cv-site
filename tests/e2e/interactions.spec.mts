import { test, expect } from '@playwright/test';

test.describe('User Interactions', () => {
    // Note: removed global beforeEach to allow per-test mock setup

    test('Theme toggle switches between light and dark mode', async ({ page }) => {
        await page.goto('/');

        const html = page.locator('html');
        const toggleBtn = page.getByRole('button', { name: /Toggle dark mode/i });

        // Get initial state
        const initialClass = await html.getAttribute('class') || '';
        const isInitiallyDark = initialClass.includes('dark-mode');

        // Click toggle
        await toggleBtn.click();

        // Verification
        if (isInitiallyDark) {
            await expect(html).not.toHaveClass(/dark-mode/);
        } else {
            await expect(html).toHaveClass(/dark-mode/);
        }

        // Toggle back
        await toggleBtn.click();
        if (isInitiallyDark) {
            await expect(html).toHaveClass(/dark-mode/);
        } else {
            await expect(html).not.toHaveClass(/dark-mode/);
        }
    });

    test('PDF Download button calls window.print', async ({ page }) => {
        // Setup mock before navigation
        let printCalled = false;
        await page.exposeFunction('mockPrint', () => {
            printCalled = true;
        });

        await page.addInitScript(() => {
            const customWindow = window as unknown as { mockPrint: () => void; print: () => void };
            customWindow.print = customWindow.mockPrint;
        });

        await page.goto('/');

        const printBtn = page.getByRole('button', { name: /Download CV as PDF/i });
        await printBtn.click();

        await expect.poll(() => printCalled).toBe(true);
    });


});
