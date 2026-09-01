import { test, expect } from '@playwright/test';
import { waitForAppShell } from './utils';

/**
 * Regression tests for a routing gap found during manual exploration on
 * 2026-09-01: the client-side router had no catch-all/404 route, so any URL
 * it didn't explicitly recognize rendered the header only, with a completely
 * empty content area and no user-facing error message.
 *
 * Fixed 2026-09-02 by adding a catch-all "*" route rendering a real
 * NotFound page. These tests now assert the fixed behavior instead.
 */
test.describe('Routing edge cases', () => {
  test('an unknown URL renders a 404 page instead of a blank one', async ({ page }) => {
    const routingWarnings: string[] = [];
    page.on('console', (msg) => {
      if (/no routes matched/i.test(msg.text())) routingWarnings.push(msg.text());
    });

    await page.goto('/this-page-does-not-exist-e2e-check');
    await waitForAppShell(page);

    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /back to home/i })).toBeVisible();
    expect(routingWarnings.length).toBe(0);
  });

  test('/forgot-password renders the 404 page rather than a blank one', async ({ page }) => {
    // Note: this only confirms the "renders blank" symptom is fixed via the
    // generic catch-all — /forgot-password is still not its own registered
    // route with a real password-reset form. That's separate, larger work
    // (needs a backend reset-token flow) tracked alongside the still-dead
    // "Forgot Password?" button on /login (see login.spec.ts). Once a real
    // reset page exists, replace this with an assertion that it renders.
    await page.goto('/forgot-password');
    await waitForAppShell(page);

    await expect(page.getByRole('heading', { name: /page not found/i })).toBeVisible();
  });
});
