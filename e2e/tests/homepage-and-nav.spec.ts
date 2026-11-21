import { test, expect } from '@playwright/test';
import { waitForAppShell, openNavMenu } from './utils';

test.describe('Homepage', () => {
  test('loads with hero content and key CTAs', async ({ page }) => {
    await page.goto('/');
    await waitForAppShell(page);

    // The hero's visible headline rotates through trip purposes; its
    // accessible name is a fixed full sentence, which is what's matched here.
    await expect(page.getByRole('heading', { level: 1, name: /stay with a trusted local/i })).toBeVisible();
    // `exact`: the final CTA cards repeat these phrases inside longer labels.
    await expect(page.getByRole('button', { name: 'I need a place to stay', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'I can host someone', exact: true })).toBeVisible();

    // The purpose section is what tells first-time visitors what the site is for.
    await expect(page.getByRole('heading', { name: 'Made for the trips that matter' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Hospital visits' })).toBeVisible();
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
    await expect(page.locator('body')).not.toContainText('Stay with a trusted local', { timeout: 10_000 });

    await openNavMenu(page);
    await page.getByText('English', { exact: true }).click();

    await expect(page.getByRole('heading', { level: 1, name: /stay with a trusted local/i })).toBeVisible();
  });
});
