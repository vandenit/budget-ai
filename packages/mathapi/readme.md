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
Copy code
export FLASK_APP=app/app.py      # Replace `app.py` with your main app file if different
export FLASK_ENV=development  # This enables debug mode
```

## Run the Flask app:

```bash
flask run
```
