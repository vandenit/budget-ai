from flask import Flask, jsonify, request
from transactions_api import get_local_transactions_last_x_days
from ynab_api import get_scheduled_transactions
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

@app.route('/local-transactions', methods=['GET'])
def local_transactions():
    # Retrieve user_id, budget_id, and x_days from query parameters
    budget_id = request.args.get('budget_id')
    x_days = request.args.get('x_days', default=30, type=int)  # Default to 30 days if not provided
    logging.info(f"Retrieving local transactions for budget ID: {budget_id} in the last {x_days} days")
    # Check for required parameters
    if not budget_id:
        return jsonify({"error": "budget_id is required as query parameter"}), 400
    # Call the service function to get transactions
    transactions = get_local_transactions_last_x_days(budget_id, x_days)
    logging.info(f"Found {len(transactions)} transactions")
    return jsonify(transactions)

@app.route('/future-transactions', methods=['GET'])
def future_transactions():
    logging.info("Retrieving future transactions")
    budget_id = request.args.get('budget_id')
    
    if not budget_id:
        return jsonify({"error": "budget_id is required as a query parameter"}), 400

    # Call the YNAB API helper function to get scheduled transactions
    result = get_scheduled_transactions(budget_id)
    
    if "error" in result:
        return jsonify(result), 500

    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
