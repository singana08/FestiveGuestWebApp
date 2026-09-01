import { test, expect } from '@playwright/test';
import { waitForAppShell } from './utils';

test.describe('Help & Support page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/help');
    await waitForAppShell(page);
  });

  test('renders support channels', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Customer Support' })).toHaveAttribute(
      'href',
      'mailto:customer-support@festiveguest.com'
    );
    await expect(page.getByRole('button', { name: 'Chat on WhatsApp' })).toBeVisible();
  });

  test('WhatsApp support opens api.whatsapp.com in a new tab without sending anything', async ({ page, context }) => {
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: 'Chat on WhatsApp' }).click(),
    ]);
    await popup.waitForLoadState('domcontentloaded');
    expect(popup.url()).toContain('whatsapp.com');
    await popup.close();
  });

  test('FAQ accordion expands and collapses an answer', async ({ page }) => {
    const question = page.getByRole('button', { name: 'How do I become a host?' });
    const answer = page.getByText(/go to the registration page, select "local host"/i);

    await expect(answer).toBeHidden();
    await question.click();
    await expect(answer).toBeVisible();
    await question.click();
    await expect(answer).toBeHidden();
  });

  test('feedback form requires all fields before submitting', async ({ page }) => {
    const submit = page.getByRole('button', { name: 'Send Feedback' });
    await submit.scrollIntoViewIfNeeded();
    await submit.click();

    await expect(page.getByText(/please fill all fields/i)).toBeVisible();
  });

  test('policy links navigate to their static pages', async ({ page }) => {
    // level: 1 — these legal pages have numbered subsection headings (e.g.
    // "12. Changes to This Privacy Policy") whose accessible name contains
    // the page title as a substring, which a plain name match resolves
    // ambiguously against the page's own <h1>. Each page has exactly one
    // h1, so scoping by level (rather than exact text, which breaks on
    // Safety Guidelines' emoji-prefixed "🛡️ Safety Guidelines" heading) is
    // what actually disambiguates it.
    await page.getByRole('link', { name: 'Terms of Service' }).click();
    await expect(page).toHaveURL(/\/terms-of-service$/);
    await expect(page.getByRole('heading', { level: 1, name: /Terms of Service/ })).toBeVisible();

    await page.goto('/help');
    await waitForAppShell(page);
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL(/\/privacy-policy$/);
    await expect(page.getByRole('heading', { level: 1, name: /Privacy Policy/ })).toBeVisible();

    await page.goto('/help');
    await waitForAppShell(page);
    await page.getByRole('link', { name: 'Safety Guidelines' }).click();
    await expect(page).toHaveURL(/\/safety-guidelines$/);
    await expect(page.getByRole('heading', { level: 1, name: /Safety Guidelines/ })).toBeVisible();
  });
});

test.describe('Static legal pages load directly (deep link)', () => {
  for (const route of ['/terms-of-service', '/privacy-policy', '/safety-guidelines']) {
    test(`GET ${route} renders content, not a blank page`, async ({ page }) => {
      await page.goto(route);
      await waitForAppShell(page);
      const mainText = await page.locator('main').innerText();
      expect(mainText.trim().length).toBeGreaterThan(0);
    });
  }
});
