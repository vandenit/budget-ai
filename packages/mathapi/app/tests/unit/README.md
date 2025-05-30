# Unit Tests for AI Category Validation

This package contains comprehensive unit tests for the new AI category validation functionality that was added to fix problems with "Ready to Assign" and invalid categories.

## Test Overview

### 1. AI Category Validation Tests (`test_ai_category_validation.py`)
Tests for validation logic in the core AI functions:

**What's being tested:**
- ✅ `suggest_category()` function validation
- ✅ `parse_category_suggestions()` function validation
- ✅ Case-insensitive category matching
- ✅ Fallback to "Uncategorized" for invalid categories
- ✅ Payee mapping cache behavior
- ✅ Handling of malformed batch responses

**Scenarios:**
- Valid AI responses
- Invalid AI responses (Ready to Assign, non-existent categories)
- Case mismatch (groceries vs Groceries)
- Complex transaction IDs with dashes
- Batch processing validation

### 2. Apply-All Service Validation Tests (`test_apply_all_service_validation.py`)
Tests for validation logic in the backend service:

**What's being tested:**
- ✅ Skip logic for "Ready to Assign" categories
- ✅ Skip logic for "Uncategorized" categories
- ✅ Proper logging of skipped transactions
- ✅ Learning of manual changes as payee mappings
- ✅ Error handling for invalid categories

**Scenarios:**
- Transactions with "Ready to Assign" suggestions
- Transactions with "Uncategorized" suggestions
- Manual changes vs AI suggestions
- Invalid category names
- Payee mapping learning behavior

## How to Run Tests

### Option 1: Simple Test Runner (Recommended)
```bash
cd packages/mathapi
python run_validation_tests.py
```

### Option 2: Individual Test Suites
```bash
# AI category validation tests
python -c "from app.tests.unit.test_ai_category_validation import test_ai_category_validation; test_ai_category_validation()"

# Apply-all service validation tests
python -c "from app.tests.unit.test_apply_all_service_validation import test_apply_all_service_validation; test_apply_all_service_validation()"
```

### Option 3: Python unittest
```bash
python -m unittest app.tests.unit.test_ai_category_validation
python -m unittest app.tests.unit.test_apply_all_service_validation
```

## Test Output Interpretation

### Successful Test Run
```
🎉 ALL VALIDATION TESTS PASSED!
✅ Ready to Assign handling works correctly
✅ Invalid category validation works correctly
✅ Case-insensitive matching works correctly
✅ Manual change learning works correctly
```

### Failed Tests
Tests will show specific failures and errors with traceback information for debugging.

## What These Tests Validate

### Problem: "Ready to Assign" Error
**Before:** AI suggests "Ready to Assign" → 404 error on apply
**After:** AI detects invalid category → falls back to "Uncategorized" → gets skipped on apply

### Problem: Case Sensitivity 
**Before:** AI suggests "groceries" → not found because it should be "Groceries"
**After:** Case-insensitive matching finds "Groceries" automatically

### Problem: Unnecessary AI Calls
**Before:** Apply-all makes new AI calls despite cached results
**After:** `is_manual_change` flag prevents unnecessary AI calls

### Problem: No Learning of Manual Changes
**Before:** Manual categorizations are not learned
**After:** Manual changes are automatically saved as payee mappings

## Test Dependencies

- `unittest.mock` for mocking
- `logging` for log validation
- The original `ai_api` and `ynab_service` modules

## Code Coverage

These tests cover the following critical paths:
- AI suggestion validation (100% of new validation code)
- Backend service validation (100% of Ready to Assign handling)
- Error scenarios and edge cases
- Integration with payee mappings and caching

## Contributing

When adding new validation features:

1. Add tests to the relevant test file
2. Update this README with new scenarios
3. Run all tests to prevent regressions
4. Ensure coverage remains high

## Troubleshooting

### Import Errors
Make sure you're running the tests from the `packages/mathapi` directory.

### MongoDB Connection Errors
The service tests connect to MongoDB for payee mappings. Ensure the database is available.

### OpenAI API Errors
The AI tests mock OpenAI calls, so no real API calls are needed during testing. 