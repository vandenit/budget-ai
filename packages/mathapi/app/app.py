from flask import Flask, jsonify, request
from ynab_api import get_scheduled_transactions
from categories_api import get_categories_for_budget
from budget_api import get_objectid_for_budget
from accounts_api import get_accounts_for_budget
from prediction_api import project_daily_balances_with_reasons
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

@app.route('/balance_prediction', methods=['GET'])
def balance_prediction():
    budget_uuid = request.args.get('budget_id')
    logging.info(f"Getting balance prediciton for budget ID: {budget_uuid}")
    # Check for required parameters
    if not budget_uuid:
        return jsonify({"error": "budget_id is required as query parameter"}), 400
    # Call the service functions to get data
    budget_id = get_objectid_for_budget(budget_uuid)
    future_transactions = get_scheduled_transactions(budget_uuid)
    categories = get_categories_for_budget(budget_id)
    accounts = get_accounts_for_budget(budget_id)
    
    # Perform balance prediction logic here
    projected_balances = project_daily_balances_with_reasons(accounts, categories, future_transactions, 300)

    # The projected_balances object is now JSON-compatible and can be rendered directly
    return jsonify(projected_balances)  # Flask's jsonify automatically converts to JSON format


    
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
