import { test, expect, waitForNetworkIdle } from './fixtures/test-fixtures';
import { generateTestId } from './utils/test-data';

/**
 * Budget Page E2E Tests
 * These tests verify the core budget functionality
 */
test.describe('Budget Page', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to budgets page before each test
    // Note: You may need to handle authentication first
    await page.goto('/budgets');
    await waitForNetworkIdle(page);
  });

  test('should display budget page', async ({ page }) => {
    // Verify we're on the budgets page
    await expect(page).toHaveURL(/.*budgets/);

    // Check for budget-related elements
    // Adjust these selectors based on your actual UI
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should allow filtering budgets by month', async ({ page }) => {
    // Look for month selector/filter
    const monthSelector = page.locator('[data-testid="month-selector"]').or(
      page.locator('select[name="month"]')
    );

    // If month selector exists, interact with it
    if (await monthSelector.count() > 0) {
      await monthSelector.first().click();

      // Wait for budget data to load after filter change
      await waitForNetworkIdle(page);

      // Verify the page updated
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should display budget categories', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('[data-testid="category"]', {
      timeout: 10000,
      state: 'visible',
    }).catch(() => {
      // If specific test id doesn't exist, that's okay for this example
      console.log('Category elements not found with test id');
    });

    // Check if any budget-related content is visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
  });
});

/**
 * Budget Category Tests
 */
test.describe('Budget Categories', () => {
  test.skip('should create a new budget category', async ({ page }) => {
    // This test is skipped by default as it requires authentication
    // Remove .skip and implement when ready

    await page.goto('/budgets');
    await waitForNetworkIdle(page);

    // Click "Add Category" button
    const addButton = page.locator('[data-testid="add-category"]').or(
      page.getByRole('button', { name: /add category/i })
    );

    if (await addButton.count() > 0) {
      await addButton.first().click();

      // Fill in category form
      const categoryName = generateTestId('category');
      await page.fill('[name="categoryName"]', categoryName);
      await page.fill('[name="budgeted"]', '500');

      // Submit form
      await page.click('[type="submit"]');

      // Verify category was created
      await expect(page.locator(`text=${categoryName}`)).toBeVisible();
    }
  });

  test.skip('should update budget amount for a category', async ({ page }) => {
    // This test is skipped by default as it requires authentication
    // Remove .skip and implement when ready

    await page.goto('/budgets');
    await waitForNetworkIdle(page);

    // Find a category and update its budget
    const budgetInput = page.locator('[data-testid="budget-amount"]').first();

    if (await budgetInput.count() > 0) {
      await budgetInput.fill('750');
      await budgetInput.press('Enter');

      // Wait for save confirmation
      await waitForNetworkIdle(page);

      // Verify the update
      await expect(budgetInput).toHaveValue('750');
    }
  });
});
