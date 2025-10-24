/**
 * Database utilities for E2E tests
 * These helpers can be used to setup and teardown test data
 */

const API_URL = process.env.API_URL || 'http://localhost:4000';

/**
 * Clean up test data from the database
 * Call this in afterEach or afterAll hooks
 */
export async function cleanupTestData(testId?: string) {
  // Implementation will depend on your API endpoints
  // Example: DELETE /api/test-data?testId={testId}

  if (!testId) {
    console.warn('No testId provided for cleanup');
    return;
  }

  try {
    // Add your cleanup logic here
    // For example, call a test-only API endpoint that cleans up test data
    console.log(`Cleaning up test data for testId: ${testId}`);
  } catch (error) {
    console.error('Failed to cleanup test data:', error);
  }
}

/**
 * Seed test data into the database
 * Call this in beforeEach or beforeAll hooks
 */
export async function seedTestData(data: any) {
  // Implementation will depend on your API endpoints
  // Example: POST /api/test-data with test data payload

  try {
    console.log('Seeding test data...');
    // Add your seeding logic here
    return data;
  } catch (error) {
    console.error('Failed to seed test data:', error);
    throw error;
  }
}

/**
 * Reset the database to a clean state
 * Use with caution - only in test environments!
 */
export async function resetDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production!');
  }

  try {
    console.log('Resetting test database...');
    // Add your database reset logic here
    // This might call a test-only API endpoint
  } catch (error) {
    console.error('Failed to reset database:', error);
    throw error;
  }
}
