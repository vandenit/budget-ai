# End-to-End Testing with Playwright

This guide explains how to set up and run Playwright E2E tests for the Budget AI web application.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Docker Test Environment](#docker-test-environment)
- [Writing Tests](#writing-tests)
- [Playwright MCP Integration](#playwright-mcp-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The E2E testing setup includes:

- **Playwright** - Modern E2E testing framework
- **Docker Compose** - Isolated test environment with MongoDB
- **Test Fixtures** - Reusable test setup and utilities
- **Multiple Browsers** - Chromium, Firefox, WebKit support
- **MCP Integration** - Compatible with Playwright MCP for AI-assisted testing

## Prerequisites

Before running E2E tests, ensure you have:

- Node.js 18+ installed
- Docker and Docker Compose installed
- npm dependencies installed (`npm install`)

## Setup

### 1. Install Playwright Browsers

First time setup requires installing Playwright browsers:

```bash
cd packages/web
npm run playwright:install
```

### 2. Configure Test Environment

Create test environment files:

```bash
# From project root
npm run setup:test
```

This creates `.env.test` files from the example templates in:
- `packages/web/.env.test`
- `packages/api/.env.test`
- `packages/mathapi/.env.test`

### 3. Update Test Environment Variables

Edit the `.env.test` files with your test credentials:

**packages/web/.env.test:**
```env
NODE_ENV=test
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_MATH_API_URL=http://localhost:5001

# Auth0 Test Configuration
AUTH0_SECRET=your-test-secret-at-least-32-chars
AUTH0_BASE_URL=http://localhost:3001
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your-test-client-id
AUTH0_CLIENT_SECRET=your-test-client-secret

NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-test-secret-at-least-32-chars
```

**packages/api/.env.test:**
```env
NODE_ENV=test
MONGODB_URI=mongodb://mongodb-test:27017/budget_ai_test
PORT=4000

# Add your test API keys
YNAB_ACCESS_TOKEN=test-token
OPENAI_API_KEY=test-key
```

## Running Tests

### Run All Tests (Headless)

```bash
# From project root
npm run test:e2e

# Or from packages/web
cd packages/web
npm run test:e2e
```

### Run Tests with UI Mode

Interactive mode with test runner UI:

```bash
npm run test:e2e:ui
```

### Run Tests in Headed Mode

See the browser while tests run:

```bash
npm run test:e2e:headed
```

### Debug Tests

Run tests in debug mode with Playwright Inspector:

```bash
npm run test:e2e:debug
```

### Run Tests for Specific Browser

```bash
# Chromium only
npm run test:e2e:chromium

# Firefox only
npm run test:e2e:firefox

# WebKit only
npm run test:e2e:webkit
```

### View Test Report

After running tests, view the HTML report:

```bash
npm run playwright:report
```

## Docker Test Environment

The test environment uses Docker Compose to run all services with a test database.

### Start Test Environment

```bash
# From project root
npm run docker:test:up
```

This starts:
- MongoDB test database (port 27018)
- API service (port 4001)
- Math API service (port 5001)
- Web service (port 3001)

### View Logs

```bash
npm run docker:test:logs
```

### Stop Test Environment

```bash
npm run docker:test:down
```

### Clean Test Environment

Remove all containers and volumes:

```bash
npm run docker:test:clean
```

### Running Tests Against Docker Environment

To run tests against the Docker environment:

```bash
# 1. Start Docker services
npm run docker:test:up

# 2. Wait for services to be healthy (check logs)
npm run docker:test:logs

# 3. Run tests with Docker base URL
cd packages/web
PLAYWRIGHT_BASE_URL=http://localhost:3001 SKIP_WEB_SERVER=true npm run test:e2e
```

## Writing Tests

### Test Structure

Tests are located in `packages/web/e2e/`:

```
e2e/
├── fixtures/
│   └── test-fixtures.ts     # Custom test fixtures
├── utils/
│   ├── test-data.ts         # Test data generators
│   └── db-helpers.ts        # Database utilities
├── example.spec.ts          # Example tests
├── budget.spec.ts           # Budget page tests
├── transactions.spec.ts     # Transaction tests
└── auth.spec.ts             # Authentication tests
```

### Basic Test Example

```typescript
import { test, expect } from './fixtures/test-fixtures';

test.describe('My Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/my-page');

    // Your test logic here
    await expect(page.locator('h1')).toHaveText('Expected Text');
  });
});
```

### Using Test Fixtures

```typescript
import { test, expect, waitForNetworkIdle } from './fixtures/test-fixtures';

test('should load data', async ({ page }) => {
  await page.goto('/budgets');
  await waitForNetworkIdle(page);

  // Page is fully loaded
  await expect(page.locator('[data-testid="budget"]')).toBeVisible();
});
```

### Using Test Data Generators

```typescript
import { generateTestId, testTransaction } from './utils/test-data';

test('should create transaction', async ({ page }) => {
  const payeeName = generateTestId('payee');

  await page.fill('[name="payee_name"]', payeeName);
  await page.fill('[name="amount"]', testTransaction.amount.toString());
});
```

### Adding Test IDs

Add `data-testid` attributes to your components for reliable selectors:

```tsx
// In your React component
<button data-testid="add-budget">Add Budget</button>

// In your test
await page.click('[data-testid="add-budget"]');
```

## Playwright MCP Integration

The test suite is designed to work with Playwright MCP (Model Context Protocol) for AI-assisted testing.

### What is Playwright MCP?

Playwright MCP is a protocol that allows AI assistants (like Claude) to interact with Playwright tests, enabling:
- Automated test generation
- Test verification and validation
- Screenshot-based testing
- Intelligent test debugging

### Using with Playwright MCP

1. **Ensure Docker Environment is Running:**
   ```bash
   npm run docker:test:up
   ```

2. **Configure MCP to Use Test Environment:**
   Set the base URL to your Docker test environment:
   ```
   Base URL: http://localhost:3001
   ```

3. **Run Tests via MCP:**
   The MCP can execute tests and verify changes:
   ```
   "Run the budget page tests and verify the new feature works"
   ```

4. **Test Verification Workflow:**
   ```bash
   # 1. Start Docker test environment
   npm run docker:test:up

   # 2. MCP can now:
   #    - Navigate to http://localhost:3001
   #    - Interact with the application
   #    - Run specific test files
   #    - Verify changes
   #    - Take screenshots
   ```

### MCP-Friendly Test Patterns

Write tests that work well with MCP:

```typescript
// Good: Descriptive test names
test('should display budget categories in alphabetical order', async ({ page }) => {
  // Clear steps
});

// Good: Use data-testid for stable selectors
await page.click('[data-testid="add-category"]');

// Good: Explicit waits and assertions
await expect(page.locator('[data-testid="category-list"]')).toBeVisible();
```

## Best Practices

### 1. Use Data Test IDs

Always prefer `data-testid` attributes over CSS classes or text selectors:

```typescript
// Good
await page.click('[data-testid="submit-button"]');

// Avoid
await page.click('.btn-primary');
```

### 2. Wait for Network Idle

Use the helper function for pages with dynamic content:

```typescript
import { waitForNetworkIdle } from './fixtures/test-fixtures';

await page.goto('/budgets');
await waitForNetworkIdle(page);
```

### 3. Clean Up Test Data

Use cleanup utilities to ensure tests don't leave data behind:

```typescript
import { cleanupTestData } from './utils/db-helpers';

test.afterEach(async () => {
  await cleanupTestData(testId);
});
```

### 4. Test Independence

Each test should be independent and not rely on other tests:

```typescript
test.beforeEach(async ({ page }) => {
  // Set up fresh state for each test
  await page.goto('/budgets');
});
```

### 5. Use Skip for Incomplete Tests

Mark tests that aren't ready as skipped:

```typescript
test.skip('should do something complex', async ({ page }) => {
  // Implementation pending
});
```

### 6. Organize Tests by Feature

Group related tests together:

```typescript
test.describe('Budget Categories', () => {
  test('should create category', async ({ page }) => { });
  test('should update category', async ({ page }) => { });
  test('should delete category', async ({ page }) => { });
});
```

## Troubleshooting

### Tests Failing with "Target closed"

The browser was closed unexpectedly. Check:
- Application crashes
- Uncaught exceptions
- Navigation errors

### Tests Timing Out

Increase timeout in `playwright.config.ts`:

```typescript
use: {
  timeout: 60000, // 60 seconds
}
```

### Docker Services Not Starting

Check logs and ensure ports aren't in use:

```bash
npm run docker:test:logs
docker ps  # Check for port conflicts
```

### Authentication Issues

For Auth0 tests:
1. Ensure test user exists in Auth0
2. Verify `.env.test` credentials are correct
3. Check Auth0 callback URLs include `http://localhost:3001`

### MongoDB Connection Errors

Ensure MongoDB service is healthy:

```bash
docker-compose -f docker-compose.test.yml ps
docker-compose -f docker-compose.test.yml logs mongodb-test
```

### Network Idle Timeout

If tests fail waiting for network idle, try:

```typescript
// Use a longer timeout
await waitForNetworkIdle(page, 10000);

// Or wait for specific element instead
await page.waitForSelector('[data-testid="content"]');
```

## Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright MCP Documentation](https://github.com/anthropics/mcp-playwright)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

## Support

If you encounter issues:

1. Check the test logs in `test-results/`
2. View the HTML report with screenshots
3. Run tests in headed mode to see what's happening
4. Check Docker logs for service issues
