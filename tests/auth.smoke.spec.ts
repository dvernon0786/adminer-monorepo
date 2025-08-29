import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'https://adminer.online';

test('unauth → sign-in round-trip preserves redirect', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
  // adjust selector to your Sign In button text if different
  const signIn = page.getByRole('link', { name: /sign in/i });
  await expect(signIn).toBeVisible();
  await signIn.click();

  // we should land on Clerk with a redirect param back to /dashboard
  await page.waitForURL(/clerk\.com|accounts\.dev|accounts\.clerk\.*/i);
  const url = page.url();
  expect(url).toMatch(/redirect|return|next/i);
  expect(decodeURIComponent(url)).toMatch(/\/dashboard/i);
}); 