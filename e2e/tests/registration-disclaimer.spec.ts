import { test, expect } from '@playwright/test';
import { waitForAppShell } from './utils';

/**
 * The guest/host registration flow is gated behind a mandatory disclaimer
 * that the user must scroll through and explicitly accept (via a checkbox)
 * before "Agree & Continue" becomes clickable. These tests verify that gate
 * behaves correctly, but deliberately stop short of completing an actual
 * registration (which would create a real account on the live site).
 *
 * A full signup completion test belongs in tests/authenticated-flows.spec.ts,
 * gated behind explicit opt-in env vars — see that file and the README.
 */
test.describe('Registration disclaimer gate', () => {
  for (const trigger of ['Join as Guest', 'Join as Host'] as const) {
    test(`"${trigger}" opens the disclaimer before registration`, async ({ page }) => {
      await page.goto('/');
      await waitForAppShell(page);

      await page.getByRole('button', { name: trigger }).click();
      await expect(page.getByRole('heading', { name: /Important Disclaimer/i })).toBeVisible({ timeout: 10_000 });

      const agreeButton = page.getByRole('button', { name: 'Agree & Continue' });
      await expect(agreeButton).toBeDisabled();

      // Cancel instead of proceeding, to avoid entering the real
      // registration form on the live site.
      await page.getByRole('button', { name: 'Cancel' }).click();
      await expect(page.getByRole('heading', { name: /Important Disclaimer/i })).toBeHidden();
    });
  }

  test('Agree & Continue only enables after checking the consent box', async ({ page }) => {
    await page.goto('/?register=true');
    await waitForAppShell(page);
    await expect(page.getByRole('heading', { name: /Important Disclaimer/i })).toBeVisible({ timeout: 10_000 });

    const agreeButton = page.getByRole('button', { name: 'Agree & Continue' });
    await expect(agreeButton).toBeDisabled();

    const consentCheckbox = page.getByRole('checkbox');
    await consentCheckbox.scrollIntoViewIfNeeded();
    await consentCheckbox.check();

    await expect(agreeButton).toBeEnabled();

    // Stop here deliberately — do not click Agree & Continue, since that
    // proceeds into the real registration form on the live site.
    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('disclaimer links to Privacy Policy and Terms of Service', async ({ page }) => {
    await page.goto('/?register=true');
    await waitForAppShell(page);
    await expect(page.getByRole('heading', { name: /Important Disclaimer/i })).toBeVisible({ timeout: 10_000 });

    await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', /privacy-policy/);
    await expect(page.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', /terms-of-service/);
  });
});
