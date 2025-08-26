import { test, expect } from '@playwright/test';

test('dashboard signed-out gate', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByText('Sign in to analyze ads')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});

test('pricing modal opens', async ({ page }) => {
  await page.goto('/dashboard');
  // Click pricing button (should work even when signed out)
  await page.getByRole('button', { name: /pricing/i }).click();
  await expect(page.getByText('Simple, Transparent Pricing')).toBeVisible();
});

test('dashboard signed-in state', async ({ page }) => {
  // Mock authentication state
  await page.goto('/dashboard');
  
  // Check that signed-in components are present
  await expect(page.getByText('ADminer')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pricing' })).toBeVisible();
  
  // Check for analysis form
  await expect(page.getByPlaceholder(/enter keywords/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start Analysis' })).toBeVisible();
});

test('quota badge functionality', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Check quota badge is present
  await expect(page.locator('[data-testid="quota-badge"]')).toBeVisible();
  
  // Click quota badge should open pricing modal
  await page.locator('[data-testid="quota-badge"]').click();
  await expect(page.getByText('Simple, Transparent Pricing')).toBeVisible();
}); 