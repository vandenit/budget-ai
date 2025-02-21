# Math API

This API provides mathematical calculations and predictions for budgeting purposes.

## Installation

1. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the API

1. Set environment variables:
```bash
export FLASK_APP=app/app.py
export FLASK_ENV=development
```

2. Start the server:
```bash
flask run
```

## API Endpoints

### Balance Predictions

### Interactive

http://127.0.0.1:5000/balance-prediction/interactive?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c&days_ahead=120

### non interactive json

http://127.0.0.1:5000/balance-prediction/data?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c&days_ahead=120

## sheduled transactions

http://127.0.0.1:5000/sheduled-transactions?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c

# category suggestions

http://127.0.0.1:5000/uncategorised-transactions/suggest-categories?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c

# apply suggestions

POST http://127.0.0.1:5000/uncategorised-transactions/apply-categories?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c

# Math API

This API provides mathematical calculations and predictions for budgeting purposes.

## Installation

```bash
pip install -r requirements.txt
```

## Running Tests

To run all tests:
```bash
PYTHONPATH=. python -m pytest
```

### Test Fixtures

The tests use fixtures stored in `app/tests/fixtures/`:
- `input_data.json`: Contains test data (categories, accounts, scheduled transactions)
- `expected_output.json`: Contains expected prediction results

To update the test fixtures with real data:
```bash
# Make sure you're in the mathapi directory
cd packages/mathapi

# Record new fixtures (this will use real API data)
PYTHONPATH=. RECORD_FIXTURES=1 python -m pytest app/tests/test_prediction_api.py::TestPredictionApi::test_record_new_fixtures -v

# Verify the tests pass with new fixtures
PYTHONPATH=. python -m pytest app/tests/test_prediction_api.py -v
```

Note: Recording new fixtures will use real data from your YNAB budget and MongoDB database. Make sure your `.env` file is properly configured.
