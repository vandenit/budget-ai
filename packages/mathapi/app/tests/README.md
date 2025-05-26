# Tests Organization 🧪

This directory contains all tests for the mathapi project, organized by category for clarity and maintainability.

## Directory Structure 📂

```
app/tests/
├── unit/                   # Pure unit tests (fast, no external deps)
│   ├── test_domiciliering.py      # Domiciliëring pattern tests
│   ├── test_country_config.py     # Country configuration tests
│   ├── test_config_fallback.py    # Config fallback logic
│   └── test_default_template.py   # Template rendering tests
├── integration/            # Integration tests (database, API, external services)
│   ├── test_batch_api.py          # Batch processing API tests
│   ├── test_batch_endpoints.py    # Batch endpoint tests
│   ├── test_batch_service.py      # Batch service layer tests
│   ├── test_prediction_api.py     # Balance prediction API tests
│   ├── test_fixtures_prediction_api.py # Prediction with fixtures
│   ├── test_api_endpoints.py      # General API endpoint tests
│   ├── test_mongo_payee_mappings.py # MongoDB payee mapping tests
│   ├── test_ai_with_real_ynab.py  # AI integration with YNAB
│   └── test_real_ynab_payee.py    # Real YNAB payee processing
├── scenarios/              # End-to-end scenario tests
│   ├── test_realistic_payee_scenarios.py # Realistic payee scenarios
│   └── test_payee_mappings.py     # Payee mapping scenarios
├── scripts/                # Test utilities and cleanup scripts
│   ├── cleanup_mappings.py        # Database cleanup utility
│   └── test_ui.py                 # UI testing utilities
└── fixtures/               # Test data and fixtures
    └── (test data files)
```

## Running Tests 🚀

### **All Tests**
```bash
pytest
```

### **By Category**
```bash
# Fast unit tests only
pytest app/tests/unit/

# Integration tests (slower, requires external services)
pytest app/tests/integration/

# Realistic scenario tests
pytest app/tests/scenarios/
```

### **By Markers**
```bash
# Unit tests only (fast)
pytest -m unit

# Integration tests
pytest -m integration

# Exclude slow tests
pytest -m "not slow"
```

### **Specific Test Files**
```bash
# Test domiciliëring preprocessing
pytest app/tests/unit/test_domiciliering.py

# Test MongoDB integration
pytest app/tests/integration/test_mongo_payee_mappings.py

# Test realistic payee scenarios
pytest app/tests/scenarios/test_realistic_payee_scenarios.py
```

### **With Coverage**
```bash
# Generate coverage report
pytest --cov=app --cov-report=html --cov-report=term-missing

# View coverage report
open htmlcov/index.html
```

## Test Categories Explained 📋

### **Unit Tests** 🔬
- **Purpose**: Test individual functions/classes in isolation
- **Characteristics**: Fast, no external dependencies, no database/API calls
- **Examples**: Config parsing, string preprocessing, business logic

### **Integration Tests** 🔗
- **Purpose**: Test interaction between components and external services
- **Characteristics**: Slower, requires database/API access, tests real integrations
- **Examples**: Database operations, API endpoints, external service calls

### **Scenario Tests** 🎭
- **Purpose**: Test realistic end-to-end workflows
- **Characteristics**: High-level tests, test complete user scenarios
- **Examples**: Complete payee processing workflows, realistic data patterns

## Development Guidelines 📝

### **Adding New Tests**
1. **Determine category**: Is it unit, integration, or scenario?
2. **Place in correct directory**: `unit/`, `integration/`, or `scenarios/`
3. **Use appropriate markers**: Add `@pytest.mark.unit` etc.
4. **Follow naming convention**: `test_feature_name.py`

### **Test Naming**
- **Files**: `test_feature_name.py`
- **Classes**: `TestFeatureName`
- **Methods**: `test_specific_behavior`

### **Example Test Structure**
```python
import pytest

@pytest.mark.unit
class TestPayeePreprocessing:
    def test_domiciliering_pattern_removal(self):
        # Test implementation
        pass
    
    def test_belgian_bank_patterns(self):
        # Test implementation
        pass
```

### **Running Tests in CI/CD**
```bash
# Quick feedback loop (unit tests only)
pytest app/tests/unit/

# Full test suite (for releases)
pytest
```

## Utilities 🛠️

### **Cleanup Scripts**
```bash
# Clean up test data
python app/tests/scripts/cleanup_mappings.py
```

### **Test Data Management**
- **Fixtures**: Stored in `fixtures/` directory
- **Mock data**: Use pytest fixtures for consistent test data
- **Database cleanup**: Automated cleanup in test teardown

---

**📊 Test Metrics**: Run `pytest --cov=app` to see current test coverage
**🐛 Debugging**: Use `pytest -v -s` for verbose output with print statements
**⚡ Speed**: Unit tests should run in < 1s, integration tests in < 30s 