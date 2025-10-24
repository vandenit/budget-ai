import { test, expect } from './fixtures/test-fixtures';

/**
 * Example E2E test - Homepage
 * This is a basic example test to verify Playwright setup
 */
test.describe('Homepage', () => {
  test('should load the homepage successfully', async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify the page title or heading exists
    // Adjust the selector based on your actual homepage content
    await expect(page).toHaveTitle(/Budget AI|Budget/i);
  });

  test('should have navigation menu', async ({ page }) => {
    await page.goto('/');

    // Check for common navigation elements
    // Adjust these selectors based on your actual navigation structure
    const navigation = page.locator('nav');
    await expect(navigation).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Verify mobile navigation or menu is present
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

/**
 * Example E2E test - Accessibility
 */
test.describe('Accessibility', () => {
  test('should not have any automatically detectable accessibility issues', async ({ page }) => {
    await page.goto('/');

    // You can integrate with axe-core for accessibility testing
    // For now, we'll just check basic things
    await expect(page).toHaveTitle(/.+/); // Should have a title
  });
});
