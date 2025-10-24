/**
 * Test data utilities for E2E tests
 * Use these to generate consistent test data
 */

export const testUsers = {
  admin: {
    email: 'admin@test.local',
    password: 'TestPassword123!',
    name: 'Test Admin',
  },
  user: {
    email: 'user@test.local',
    password: 'TestPassword123!',
    name: 'Test User',
  },
};

export const testBudget = {
  name: 'Test Budget 2024',
  month: new Date().toISOString().substring(0, 7), // YYYY-MM format
  categories: [
    {
      name: 'Groceries',
      budgeted: 500,
      category_group: 'Monthly Expenses',
    },
    {
      name: 'Transportation',
      budgeted: 200,
      category_group: 'Monthly Expenses',
    },
    {
      name: 'Entertainment',
      budgeted: 150,
      category_group: 'Monthly Expenses',
    },
  ],
};

export const testTransaction = {
  payee_name: 'Test Payee',
  amount: -50.00,
  date: new Date().toISOString().split('T')[0],
  memo: 'Test transaction from E2E test',
  category_name: 'Groceries',
};

/**
 * Generate a unique identifier for test data
 */
export function generateTestId(prefix: string = 'test') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Generate a unique email for testing
 */
export function generateTestEmail(prefix: string = 'test') {
  return `${generateTestId(prefix)}@test.local`;
}
