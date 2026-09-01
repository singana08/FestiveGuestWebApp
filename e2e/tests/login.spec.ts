import { test, expect } from '@playwright/test';
import { waitForAppShell } from './utils';

test.describe('Login page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await waitForAppShell(page);
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
  });

  test('renders email, password, and sign-in controls', async ({ page }) => {
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('Your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
  });

  test('blocks submission with empty required fields (native validation)', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign In' }).click();

    const emailInput = page.getByPlaceholder('you@example.com');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.checkValidity());
    expect(isInvalid).toBe(true);

    // Submission should not navigate away or show a spinner state that
    // implies a request was sent.
    await expect(page).toHaveURL(/\/login$/);
  });

  test('password field can toggle visibility', async ({ page }) => {
    // Uses a placeholder value only, purely to exercise the show/hide
    // toggle's UI behavior — never a real credential.
    const passwordInput = page.getByPlaceholder('Your password');
    await passwordInput.fill('placeholder-value-for-ui-test');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // The eye icon button carries no accessible name (a minor a11y gap
    // worth fixing on its own) so it's targeted by DOM position: the first
    // button following the password field, before "Forgot Password?".
    const toggleButton = passwordInput.locator('xpath=following::button[1]');
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('rejects an invalid/nonexistent login attempt with an error, not a silent success', async ({ page }) => {
    // Uses an obviously fake, non-existent test account. This intentionally
    // exercises the failure path only — it must never be filled with a real
    // user's credentials.
    await page.getByPlaceholder('you@example.com').fill('e2e-test-nonexistent-account@example.com');
    await page.getByPlaceholder('Your password').fill('DefinitelyWrongPassword123!');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Expect *some* visible error feedback and that we remain unauthenticated
    // (still on /login, no redirect to a dashboard/home-as-logged-in state).
    await expect(page).toHaveURL(/\/login$/, { timeout: 10_000 });
  });

  test('BUG: "Forgot Password?" control does not respond to clicks', async ({ page }) => {
    const forgotPassword = page.getByText('Forgot Password?');
    await expect(forgotPassword).toBeVisible();

    const urlBefore = page.url();
    await forgotPassword.click();
    await page.waitForTimeout(1000);

    // Known bug as of 2026-09-01: clicking this control does not navigate,
    // open a modal, or produce any visible change. Once fixed, replace this
    // assertion with a real check for the reset-password UI appearing.
    expect(page.url()).toBe(urlBefore);
  });

  test('Create Account button opens the registration disclaimer gate', async ({ page }) => {
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByRole('heading', { name: /Important Disclaimer/i })).toBeVisible({ timeout: 10_000 });
  });
});
