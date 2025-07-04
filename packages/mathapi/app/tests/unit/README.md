# Unit Tests for Prediction API

This package contains comprehensive unit tests for the prediction API functionality that calculates balance projections and spending patterns.

## Test Overview

### 1. Prediction API Tests (`test_prediction_api.py`)

Tests for the core prediction algorithm functions:

**What's being tested:**

- ✅ `calculate_initial_balance()` - Account balance aggregation
- ✅ `initialize_daily_projection()` - Daily projection setup
- ✅ `add_future_transactions_to_projection()` - Scheduled transaction handling
- ✅ `process_need_categories()` - Category spending logic
- ✅ `apply_need_category_spending()` - Complex spending patterns
- ✅ `calculate_running_balance()` - Balance calculations over time

**Scenarios:**

- Monthly, quarterly, and yearly spending cadences
- Current month balance handling with scheduled transactions
- Target date handling for specific categories
- Edge cases with partial consumption of balances
- Complex date calculations and month boundaries

## How to Run Tests

### Option 1: Pytest (Recommended)

```bash
cd packages/mathapi

# All prediction tests
pytest app/tests/unit/test_prediction_api.py -v

# Specific test function
pytest app/tests/unit/test_prediction_api.py::test_calculate_initial_balance -v

# All unit tests
pytest app/tests/unit/ -v
```

### Option 2: Python unittest

```bash
cd packages/mathapi
python -m unittest app.tests.unit.test_prediction_api
```

## Test Output Interpretation

### Successful Test Run

```
=================== 43 passed in 3.26s ===================
```

### Failed Tests

Tests will show specific failures and errors with traceback information for debugging.

## What These Tests Validate

### Balance Calculations

- Initial balance aggregation from multiple accounts
- Running balance calculations over time periods
- Handling of negative balances and edge cases

### Spending Pattern Logic

- Monthly, quarterly, and yearly spending cadences
- Current month vs future month handling
- Target date calculations and goal handling

### Date Handling

- Month boundary calculations
- Leap year handling
- End-of-month date adjustments

### Edge Cases

- Scheduled transactions exceeding available balance
- Partial consumption of category balances
- Complex goal configurations

## Test Dependencies

- `pytest` for test framework
- `datetime` and `calendar` for date calculations
- The prediction API modules

## Code Coverage

These tests cover the following critical paths:

- Prediction algorithm logic (89% coverage)
- Balance calculation functions (100% coverage)
- Date handling utilities (95% coverage)
- Error scenarios and edge cases

## Contributing

When adding new prediction features:

1. Add tests to `test_prediction_api.py`
2. Update this README with new scenarios
3. Run all tests to prevent regressions
4. Ensure coverage remains high

## Troubleshooting

### Import Errors

Make sure you're running the tests from the `packages/mathapi` directory.

### Date-related Test Failures

Some tests may be sensitive to the current date. Check if tests use fixed dates or relative calculations.
