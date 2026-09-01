import { Page, expect } from '@playwright/test';

/**
 * FestiveGuest is a client-rendered SPA that shows a branded splash/loading
 * screen for a couple of seconds on every hard navigation before the real
 * page content mounts. Waiting on network idle alone is not reliable here,
 * so tests should wait for a concrete piece of real content instead.
 *
 * This helper waits for the persistent header logo (present on every route,
 * including broken ones) so it can be reused as a general "app booted"
 * check before asserting on page-specific content.
 */
export async function waitForAppShell(page: Page) {
  await expect(page.getByAltText('FestiveGuest Logo')).toBeVisible({ timeout: 15_000 });
}

/** Opens the mobile/hamburger nav menu if this viewport has one. At the
 * "Desktop Chrome" project's viewport the hamburger isn't rendered at all
 * (the nav is a plain always-visible horizontal bar instead), so this is a
 * no-op there — safe to call unconditionally regardless of project/viewport
 * or whether the menu is already open. */
export async function openNavMenu(page: Page) {
  const toggle = page.getByRole('button', { name: /toggle menu/i });
  if (await toggle.isVisible().catch(() => false)) {
    await toggle.click();
  }
}

/** Switches the site language via the nav menu's language toggle, if it is
 * not already on the target language. Used to reset state between tests
 * since the site persists the chosen language across sessions. */
export async function ensureEnglish(page: Page) {
  await openNavMenu(page);
  const englishOption = page.getByText('English', { exact: true });
  if (await englishOption.isVisible().catch(() => false)) {
    await englishOption.click();
  } else {
    // Menu may already be closed if we were already in English; re-open,
    // check, and close again to leave the UI in a known state.
    await page.keyboard.press('Escape');
  }
}
