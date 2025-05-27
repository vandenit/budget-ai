# MathAPI Test Suite

This project has a structured test suite with different test categories.

## 📁 Test Structure

```
app/tests/
├── unit/           # Unit tests (no external dependencies)
├── integration/    # Integration tests (real DB/API connections)
├── scenarios/      # End-to-end scenario tests
└── fixtures/       # Test data and helpers
```

## 🧪 Test Categories

### Unit Tests (`app/tests/unit/`)
- ✅ **No external dependencies**
- ✅ **Fast and reliable**
- ✅ **Run in CI/CD**
- ✅ **Mock all external calls**

**Contains:**
- AI category validation tests
- Apply-all service validation tests
- Business logic tests
- Configuration tests

### Integration Tests (`app/tests/integration/`)
- ⚠️ **Require real database connections**
- ⚠️ **Require running services**
- ⚠️ **Not in CI/CD (for now)**
- ✅ **End-to-end functionality**

**Contains:**
- MongoDB payee mappings tests
- YNAB API integration tests
- Flask API endpoint tests
- Batch processing tests

## 🚀 Running Tests

### For Development (all tests)
```bash
cd packages/mathapi

# All unit tests
pytest app/tests/unit/ -v

# All integration tests (requires services)
pytest app/tests/integration/ -v

# All tests
pytest -v
```

### For CI/CD (unit tests only)
```bash
cd packages/mathapi

# Unit tests only (used in GitHub Actions)
pytest app/tests/unit/ -v

# Or with markers
pytest -m "not integration" -v
```

### Validation Test Suite
```bash
# Comprehensive validation tests
python app/tests/unit/test_validation_suite.py

# Interactive test runner
python app/tests/unit/test_validation_suite.py --interactive
```

## ⚙️ CI/CD Configuration

**GitHub Actions** (`.github/workflows/dev-workflow.yml`):
- ✅ Runs only **unit tests**
- ❌ Skips **integration tests**
- 📝 Uses: `pytest app/tests/unit/ -v`

**Why no integration tests in CI:**
- Require MongoDB database setup
- Require running Flask server
- Require YNAB API keys
- Require external service configuration

## 🏷️ Test Markers

Tests are marked with pytest markers:

```python
@pytest.mark.unit          # Unit test (mocked dependencies)
@pytest.mark.integration   # Integration test (real connections)
@pytest.mark.slow         # Slow test (excluded from quick runs)
```

**Using markers:**
```bash
# Unit tests only
pytest -m unit

# Everything except integration tests
pytest -m "not integration"

# Integration tests only (local)
pytest -m integration
```

## 📊 Test Coverage

Unit tests cover:
- ✅ AI category validation logic
- ✅ Apply-all service validation
- ✅ Error handling scenarios
- ✅ Business logic validation
- ✅ Configuration handling

Integration tests cover:
- ✅ Database CRUD operations
- ✅ API endpoint functionality
- ✅ External service integration
- ✅ End-to-end workflows

## 🔧 Local Setup For Integration Tests

If you want to run integration tests locally:

1. **MongoDB Setup:**
   ```bash
   # Start MongoDB (docker)
   docker run -d -p 27017:27017 mongo:latest
   
   # Or use MongoDB Atlas
   export MONGODB_URI="mongodb://localhost:27017"
   ```

2. **Flask Server:**
   ```bash
   cd packages/mathapi
   python app/app.py
   ```

3. **YNAB API Keys:**
   ```bash
   export YNAB_API_KEY="your-api-key"
   ```

4. **Run Integration Tests:**
   ```bash
   pytest app/tests/integration/ -v
   ```

## 🐛 Troubleshooting

### Import Errors
Make sure you're in the `packages/mathapi` directory.

### MongoDB Connection Errors
Check if `MONGODB_URI` environment variable is set.

### API Connection Errors
For API tests, ensure the Flask server is running on `localhost:5000`.

### Test Discovery Issues
Check if `__init__.py` files exist in test directories.

## 📈 Future Extensions

- [ ] Test database setup in CI
- [ ] Docker compose for integration tests
- [ ] Performance benchmarking tests
- [ ] Security vulnerability tests
- [ ] Load testing for API endpoints 