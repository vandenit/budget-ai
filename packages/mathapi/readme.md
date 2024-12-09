# activate env

```
source env/bin/activate

```

# install deps

```
pip install -r requirements.txt
```

# Step 4: Run the Flask App

With dependencies installed, you can start the Flask app.

## Set the Flask app environment:

```bash
export FLASK_APP=app/app.py      # Replace `app.py` with your main app file if different
export FLASK_ENV=development  # This enables debug mode
```

## Run the Flask app:

```bash
flask run
```

## balance predictions

### Interactive

http://127.0.0.1:5000/balance-prediction/interactive?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c&days_ahead=120

### non interactive json

http://127.0.0.1:5000/balance-prediction/data?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c&days_ahead=120

## sheduled transactions

http://127.0.0.1:5000/sheduled-transactions?budget_id=1b443ebf-ea07-4ab7-8fd5-9330bf80608c
