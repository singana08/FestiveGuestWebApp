import { test, expect } from '@playwright/test';
import { waitForAppShell, openNavMenu } from './utils';

test.describe('Homepage', () => {
  test('loads with hero content and key CTAs', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    await expect(page.getByRole('heading', { name: /find a trusted local host/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join as Guest' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join as Host' })).toBeVisible();

    // Trust/stat strip should render real numbers, not placeholders. Scoped
    // to .exact match — "Verified Hosts" also appears (differently cased,
    // with an emoji) in an unrelated badge elsewhere on the page.
    await expect(page.getByText('20+')).toBeVisible();
    await expect(page.getByText('Verified Hosts', { exact: true })).toBeVisible();
  });

  test('has no console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await waitForAppShell(page);
    await page.waitForTimeout(1500); // let async widgets (3D hero, etc.) settle

    expect(errors, `Unexpected console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('header navigation links point to the right routes', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);
    // On mobile these links live behind the hamburger menu; no-op on desktop.
    await openNavMenu(page);

    await expect(page.getByRole('link', { name: 'Help', exact: true })).toHaveAttribute('href', '/help');
    await expect(page.getByRole('link', { name: 'Login', exact: true })).toHaveAttribute('href', '/login');
    await expect(page.getByRole('link', { name: 'Register', exact: true })).toHaveAttribute('href', '/?register=true');
  });

  test('footer policy links navigate to the correct static pages', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy-policy');
    await expect(footer.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms-of-service');
    await expect(footer.getByRole('link', { name: 'Safety Guidelines' })).toHaveAttribute('href', '/safety-guidelines');
  });

  test('language toggle switches to Telugu and back', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    await openNavMenu(page);
    await page.getByRole('button', { name: 'తెలుగు' }).click();

    // Hero heading text changes once translated.
    await expect(page.locator('body')).not.toContainText('Find a Trusted Local Host', { timeout: 10_000 });

    await openNavMenu(page);
    await page.getByText('English', { exact: true }).click();

    await expect(page.getByRole('heading', { name: /find a trusted local host/i })).toBeVisible();
  });
});
