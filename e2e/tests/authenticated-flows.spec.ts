import { test, expect } from '@playwright/test';
import { waitForAppShell } from './utils';

/**
 * These flows all require a real, dedicated TEST account on FestiveGuest
 * (never a real user's account or credentials). They are skipped by
 * default and only run when you provide that test account via env vars,
 * so this suite never creates accounts or logs in with anything on its own:
 *
 *   FG_TEST_EMAIL=qa+e2e@yourcompany.com
 *   FG_TEST_PASSWORD=<the test account's password>
 *
 * Recommended: create one throwaway "Guest" test account by hand once
 * (accepting the disclaimer yourself), then point CI at it via secrets.
 */
const email = process.env.FG_TEST_EMAIL;
const password = process.env.FG_TEST_PASSWORD;
const haveCreds = Boolean(email && password);

test.describe('Authenticated flows (require FG_TEST_EMAIL / FG_TEST_PASSWORD)', () => {
  test.skip(!haveCreds, 'Set FG_TEST_EMAIL and FG_TEST_PASSWORD to run authenticated flows');

  test('logs in successfully with a valid test account', async ({ page }) => {
    await page.goto('/login');
    await waitForAppShell(page);

    await page.getByPlaceholder('you@example.com').fill(email!);
    await page.getByPlaceholder('Your password').fill(password!);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Replace with whatever the real post-login destination/marker is
    // (e.g. an avatar/menu item, a dashboard heading).
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 });
  });

  test('can browse or search for hosts once signed in', async ({ page }) => {
    await page.goto('/login');
    await waitForAppShell(page);
    await page.getByPlaceholder('you@example.com').fill(email!);
    await page.getByPlaceholder('Your password').fill(password!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).not.toHaveURL(/\/login$/, { timeout: 15_000 });

    // TODO: fill in once the authenticated search/browse UI and its
    // selectors are confirmed post-login (e.g. a city search box, a list
    // of host cards). This is intentionally left as a template rather than
    // guessed at, since it wasn't reachable without a test account during
    // the initial exploration pass.
    test.fixme(true, 'Fill in real selectors for the host search/browse UI');
  });

  test('can start (not complete) a booking request with a host', async ({ page }) => {
    test.fixme(true, 'Fill in once a specific host/listing flow is confirmed with a test account');
  });
});

/**
 * Full registration completion is intentionally NOT automated here.
 * Running it against the live site would create a real account on every
 * CI run. If you want this covered, point BASE_URL at a staging
 * environment that's safe to write to and lift this skip there, e.g.:
 *
 *   test.skip(process.env.BASE_URL === undefined, 'Run only against staging');
 */
test.describe('Guest registration completion (staging only — skipped against production)', () => {
  test.skip(true, 'Enable only when BASE_URL points at a non-production environment');

  test('completes guest signup with a disposable test email', async ({ page }) => {
    // TODO: fill in with a real, disposable test email strategy
    // (e.g. a mailbox-per-run service) before enabling on staging.
  });
});
