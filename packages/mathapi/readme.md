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

- Interactive view:  
  `GET /balance-prediction/interactive?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c&days_ahead=120`

- JSON data:  
  `GET /balance-prediction/data?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c&days_ahead=120`

### Scheduled Transactions
`GET /sheduled-transactions?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c`

### Category Management

- Get category suggestions:  
  `GET /uncategorised-transactions/suggest-categories?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c`

- Apply categories:  
  `POST /uncategorised-transactions/apply-categories?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c`

## Testing

### Running Tests

To run all tests:
```bash
PYTHONPATH=. python -m pytest
```

### Test Fixtures

The tests use fixtures stored in `app/tests/fixtures/`:
- `input_data.json`: Test data (categories, accounts, scheduled transactions)
- `expected_output.json`: Expected prediction results

### Updating Test Fixtures

To update fixtures with real data:
```bash
cd packages/mathapi
PYTHONPATH=. RECORD_FIXTURES=1 python -m pytest app/tests/test_prediction_api.py::TestPredictionApi::test_record_new_fixtures -v
```

To verify the new fixtures:
```bash
PYTHONPATH=. python -m pytest app/tests/test_prediction_api.py -v
```

Note: Make sure your `.env` file is properly configured when recording new fixtures.
