# MathAPI Test Suite

This project has a focused test suite for prediction functionality.

## 📁 Test Structure

```
app/tests/
└── unit/           # Unit tests (no external dependencies)
    ├── test_prediction_api.py  # Prediction algorithm tests
    └── README.md              # This file
```

## 🧪 Test Categories

### Unit Tests (`app/tests/unit/`)

- ✅ **No external dependencies**
- ✅ **Fast and reliable**
- ✅ **Run in CI/CD**
- ✅ **Mock all external calls**

**Contains:**

- Prediction API algorithm tests
- Balance calculation tests
- Category spending logic tests
- Date handling tests

## 🚀 Running Tests

### For Development

```bash
cd packages/mathapi

# All unit tests
pytest app/tests/unit/ -v

# All tests (same as unit tests)
pytest -v

# Specific test file
pytest app/tests/unit/test_prediction_api.py -v
```

### For CI/CD

```bash
cd packages/mathapi

# Unit tests (used in GitHub Actions)
pytest app/tests/unit/ -v
```

## ⚙️ CI/CD Configuration

**GitHub Actions** (`.github/workflows/dev-workflow.yml`):

- ✅ Runs **unit tests**
- 📝 Uses: `pytest app/tests/unit/ -v`

## 🏷️ Test Markers

Tests are marked with pytest markers:

```python
@pytest.mark.unit          # Unit test (mocked dependencies)
@pytest.mark.slow         # Slow test (excluded from quick runs)
```

**Using markers:**

```bash
# Unit tests only
pytest -m unit

# Fast tests only
pytest -m "not slow"
```

## 📊 Test Coverage

Unit tests cover:

- ✅ Prediction algorithm logic
- ✅ Balance calculation functions
- ✅ Category spending patterns
- ✅ Date handling and edge cases
- ✅ Error scenarios

## Troubleshooting

### Import Errors

Make sure you're in the `packages/mathapi` directory.

### Test Discovery Issues

Check if `__init__.py` files exist in test directories.

## 📈 Future Extensions

- [ ] Performance benchmarking tests for prediction algorithms
- [ ] Memory usage tests for large datasets
- [ ] Edge case testing for extreme date ranges
