import { test, expect } from '@playwright/test';

test('design system page renders', async ({ page }) => {
  await page.goto('/design-system');
  await expect(page.locator('h1')).toHaveText('Design System');
});
