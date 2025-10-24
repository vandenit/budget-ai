# Testing Guide - Budget AI

This document provides an overview of the testing strategy and tools used in the Budget AI project.

## Testing Stack

The project uses different testing tools for different purposes:

- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing
- **Pytest** - Python service testing (Math API)

## Project Structure

```
budget-ai/
├── packages/
│   ├── web/              # Next.js Frontend
│   │   ├── __tests__/    # Vitest unit tests
│   │   └── e2e/          # Playwright E2E tests
│   ├── api/              # Express Backend
│   │   └── tests/        # Vitest unit tests
│   └── mathapi/          # Flask Python Service
│       └── app/tests/    # Pytest unit tests
├── docker-compose.yml         # Development environment
└── docker-compose.test.yml    # Test environment with MongoDB
```

## Quick Start

### Unit Tests

Run unit tests for all packages:

```bash
# Run all unit tests
npm test

# Run unit tests for specific package
npm test --workspace=web
npm test --workspace=api

# Python tests
cd packages/mathapi
pytest
```

### E2E Tests

Run end-to-end tests with Playwright:

```bash
# First time setup
npm run setup:test
cd packages/web && npm run playwright:install

# Run E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui
```

For detailed E2E testing instructions, see [E2E Testing Guide](packages/web/E2E_TESTING.md).

## Test Environments

### Development Environment

For local development with hot reloading:

```bash
npm run dev
```

This starts:
- Web: http://localhost:3000
- API: http://localhost:4000
- Math API: http://localhost:5000

### Test Environment (Docker)

For E2E testing with isolated test database:

```bash
# Start test environment
npm run docker:test:up

# View logs
npm run docker:test:logs

# Stop test environment
npm run docker:test:down

# Clean up (removes volumes)
npm run docker:test:clean
```

Test services run on different ports:
- Web: http://localhost:3001
- API: http://localhost:4001
- Math API: http://localhost:5001
- MongoDB: mongodb://localhost:27018

## Testing Best Practices

### 1. Test Pyramid

Follow the test pyramid approach:
- **Many** unit tests (fast, isolated)
- **Some** integration tests (moderate speed)
- **Few** E2E tests (slow, comprehensive)

### 2. Test Independence

Each test should:
- Set up its own data
- Clean up after itself
- Not depend on other tests
- Be runnable in isolation

### 3. Meaningful Test Names

Use descriptive test names:

```typescript
// Good
test('should display error when budget amount is negative')

// Avoid
test('budget test 1')
```

### 4. Use Test IDs

Add `data-testid` attributes for E2E testing:

```tsx
<button data-testid="submit-button">Submit</button>
```

### 5. Mock External Services

Mock external APIs in unit tests:
- YNAB API
- OpenAI API
- Auth0

Use real services only in E2E tests.

## Test Coverage

### Current Coverage

| Package | Type | Coverage |
|---------|------|----------|
| web | Unit | Partial |
| api | Unit | Partial |
| mathapi | Unit | Partial |
| All | E2E | Basic |

### Improving Coverage

Priority areas for test coverage:
1. Budget calculation logic
2. Transaction processing
3. YNAB synchronization
4. AI prediction algorithms
5. User authentication flows

## Continuous Integration

### GitHub Actions (Future)

```yaml
# Example CI workflow
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e
```

## Debugging Tests

### Unit Tests

```bash
# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- budget.test.ts

# Run with coverage
npm test -- --coverage
```

### E2E Tests

```bash
# Debug mode with Playwright Inspector
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed

# UI mode (interactive)
npm run test:e2e:ui
```

### View Test Reports

```bash
# Playwright HTML report
npm run playwright:report

# Test results in test-results/
ls packages/web/test-results/
```

## MCP Integration

### Playwright MCP

The E2E test suite is compatible with Playwright MCP for AI-assisted testing.

**Setup:**
1. Start Docker test environment: `npm run docker:test:up`
2. Configure MCP with base URL: `http://localhost:3001`
3. MCP can now run tests and verify changes

**Use Cases:**
- Automated test generation
- Visual regression testing
- Test verification after code changes
- Screenshot-based testing

For more details, see [E2E Testing Guide - MCP Integration](packages/web/E2E_TESTING.md#playwright-mcp-integration).

## Common Issues

### Port Already in Use

If ports are already in use, stop conflicting services:

```bash
# Check what's using the port
lsof -i :3000

# Stop Docker services
docker-compose down
npm run docker:test:down
```

### MongoDB Connection Issues

Ensure MongoDB is running:

```bash
# Check MongoDB status
docker ps | grep mongo

# View MongoDB logs
docker logs budget-ai-mongodb-test
```

### Playwright Browser Issues

Reinstall browsers if tests fail to launch:

```bash
cd packages/web
npx playwright install --force
```

### Auth0 Test Issues

For authentication tests:
1. Create test users in Auth0 dashboard
2. Add `http://localhost:3001` to callback URLs
3. Update `.env.test` with correct credentials

## Additional Documentation

- [E2E Testing with Playwright](packages/web/E2E_TESTING.md)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Pytest Documentation](https://docs.pytest.org/)

## Contributing

When adding new features:

1. Write unit tests first (TDD)
2. Add E2E tests for critical user flows
3. Ensure tests pass before submitting PR
4. Update this documentation if needed

## Support

For testing issues:
1. Check relevant documentation above
2. Review test logs and reports
3. Run tests in debug/headed mode
4. Check Docker logs for service issues
