import { test, expect } from '@playwright/test';

test('has title and dashboard content', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await expect(page).toHaveTitle(/Retail Lakehouse/);
  await expect(page.locator('text=Retail Lakehouse Data Platform')).toBeVisible();
  await expect(page.locator('text=Total Revenue Today')).toBeVisible();
  await expect(page.locator('text=Revenue Velocity')).toBeVisible();
});
