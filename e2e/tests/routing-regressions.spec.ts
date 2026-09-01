import { test, expect } from '@playwright/test';
import { waitForAppShell } from './utils';

/**
 * Regression tests for a routing gap found during manual exploration on
 * 2026-09-01: the client-side router has no catch-all/404 route, so any
 * URL it doesn't explicitly recognize renders the header only, with a
 * completely empty content area and no user-facing error message.
 *
 * The console reliably logs "No routes matched location <path>" in this
 * failure case (from the app's router library), which these tests assert
 * on directly so a fix (adding a proper 404 page, or wiring up the missing
 * route) is unambiguously detected.
 */
test.describe('Routing edge cases', () => {
  test('BUG: an unknown URL renders a blank page instead of a 404', async ({ page }) => {
    const routingWarnings: string[] = [];
    page.on('console', (msg) => {
      if (/no routes matched/i.test(msg.text())) routingWarnings.push(msg.text());
    });

    await page.goto('/this-page-does-not-exist-e2e-check');
    await waitForAppShell(page); // header still renders

    const main = page.locator('main');
    await page.waitForTimeout(1000);
    const mainText = (await main.innerText().catch(() => '')).trim();

    // Once fixed (either a real 404 page or a redirect to "/"), replace
    // this with a positive assertion, e.g. expect(page.getByText(/page not found/i)).toBeVisible()
    expect(mainText, 'Expected the known bug: unmatched routes leave <main> empty').toBe('');
    expect(routingWarnings.length).toBeGreaterThan(0);
  });

  test('BUG: /forgot-password itself is not a registered route', async ({ page }) => {
    const routingWarnings: string[] = [];
    page.on('console', (msg) => {
      if (/no routes matched/i.test(msg.text())) routingWarnings.push(msg.text());
    });

    await page.goto('/forgot-password');
    await waitForAppShell(page);

    const main = page.locator('main');
    await page.waitForTimeout(1000);
    const mainText = (await main.innerText().catch(() => '')).trim();

    // This means a bookmarked or shared "forgot password" link is broken
    // for any user, independent of the dead button on /login (see
    // login.spec.ts). Once a real /forgot-password page exists, replace
    // this with an assertion that the reset form renders.
    expect(mainText, 'Expected the known bug: /forgot-password has no matching route').toBe('');
    expect(routingWarnings.length).toBeGreaterThan(0);
  });
});
