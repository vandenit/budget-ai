import { test, expect, waitForNetworkIdle } from './fixtures/test-fixtures';
import { testUsers } from './utils/test-data';

/**
 * Authentication E2E Tests
 *
 * NOTE: These tests are skipped by default because they require:
 * 1. Auth0 test credentials configured
 * 2. Test user accounts created
 * 3. Proper environment variables set
 *
 * To enable these tests:
 * 1. Set up test users in Auth0
 * 2. Configure .env.test with Auth0 credentials
 * 3. Remove .skip from the tests you want to run
 */
test.describe('Authentication', () => {
  test.skip('should redirect unauthenticated users to login', async ({ page }) => {
    // Navigate to a protected route
    await page.goto('/budgets');

    // Should redirect to login
    await page.waitForURL(/.*login|auth|signin/, { timeout: 10000 });

    // Verify we're on the login page
    const loginButton = page.getByRole('button', { name: /sign in|log in/i });
    await expect(loginButton).toBeVisible();
  });

  test.skip('should allow user to login', async ({ page }) => {
    // Navigate to login page
    await page.goto('/api/auth/signin');

    // Wait for Auth0 login form
    await page.waitForSelector('input[name="username"], input[type="email"]', {
      timeout: 10000,
    });

    // Fill in credentials
    await page.fill('input[name="username"], input[type="email"]', testUsers.user.email);
    await page.fill('input[name="password"], input[type="password"]', testUsers.user.password);

    // Submit login form
    await page.click('button[type="submit"], button[name="submit"]');

    // Wait for redirect back to app
    await page.waitForURL(/.*budgets|dashboard/, { timeout: 15000 });

    // Verify user is logged in
    const userMenu = page.locator('[data-testid="user-menu"]').or(
      page.locator('button').filter({ hasText: testUsers.user.email })
    );

    if (await userMenu.count() > 0) {
      await expect(userMenu.first()).toBeVisible();
    }
  });

  test.skip('should allow user to logout', async ({ page }) => {
    // Assume user is already logged in from previous test
    // In practice, you'd want to set up authentication state first

    await page.goto('/');
    await waitForNetworkIdle(page);

    // Find and click logout button
    const userMenu = page.locator('[data-testid="user-menu"]');
    if (await userMenu.count() > 0) {
      await userMenu.click();
    }

    const logoutButton = page.getByRole('button', { name: /log out|sign out/i });
    await logoutButton.click();

    // Wait for logout to complete
    await page.waitForURL(/.*login|auth|signin|^\/$/, { timeout: 10000 });

    // Verify user is logged out
    const loginButton = page.getByRole('button', { name: /sign in|log in/i });
    if (await loginButton.count() > 0) {
      await expect(loginButton).toBeVisible();
    }
  });

  test.skip('should handle invalid credentials', async ({ page }) => {
    await page.goto('/api/auth/signin');

    await page.waitForSelector('input[name="username"], input[type="email"]', {
      timeout: 10000,
    });

    // Try to login with invalid credentials
    await page.fill('input[name="username"], input[type="email"]', 'invalid@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');

    await page.click('button[type="submit"], button[name="submit"]');

    // Wait for error message
    const errorMessage = page.locator('[data-testid="error"]').or(
      page.locator('text=/wrong|invalid|incorrect/i')
    );

    await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
  });
});

/**
 * Session Management Tests
 */
test.describe('Session Management', () => {
  test.skip('should maintain session across page refreshes', async ({ page }) => {
    // Assume user is logged in
    await page.goto('/budgets');
    await waitForNetworkIdle(page);

    // Verify user is logged in
    const userMenu = page.locator('[data-testid="user-menu"]');
    if (await userMenu.count() > 0) {
      await expect(userMenu).toBeVisible();
    }

    // Refresh the page
    await page.reload();
    await waitForNetworkIdle(page);

    // User should still be logged in
    if (await userMenu.count() > 0) {
      await expect(userMenu).toBeVisible();
    }
  });

  test.skip('should handle expired sessions gracefully', async ({ page }) => {
    // This test would require simulating session expiration
    // Implementation depends on your session management strategy
    await page.goto('/budgets');

    // Simulate expired session by clearing cookies or tokens
    await page.context().clearCookies();

    // Navigate to a protected route
    await page.goto('/budgets');

    // Should redirect to login
    await page.waitForURL(/.*login|auth|signin/, { timeout: 10000 });
  });
});
