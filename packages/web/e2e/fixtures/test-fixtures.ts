import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Extended fixtures for Budget AI E2E tests
 * Add custom fixtures here that can be reused across tests
 */
type CustomFixtures = {
  // Add custom fixtures here as needed
  // Example: authenticatedPage: Page;
};

/**
 * Extend the base test with custom fixtures
 */
export const test = base.extend<CustomFixtures>({
  // Add custom fixture implementations here
  // Example:
  // authenticatedPage: async ({ page }, use) => {
  //   // Setup authentication
  //   await page.goto('/api/auth/signin');
  //   // ... authentication logic
  //   await use(page);
  // },
});

export { expect };

/**
 * Helper function to wait for network idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Helper function to wait for hydration (Next.js specific)
 */
export async function waitForHydration(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    // Wait for React hydration
    return (window as any).__NEXT_DATA__ !== undefined;
  });
}
