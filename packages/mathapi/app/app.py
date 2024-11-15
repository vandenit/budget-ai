from flask import Flask, jsonify, request, render_template
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


# New route for interactive HTML
@app.route('/balance-prediction/interactive', methods=['GET'])
def balance_prediction_interactive():
    # Step 1: Get `budget_id` from query parameters
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return "budget_id query parameter is required", 400

    # Step 2: Fetch data for predictions
    try:
        budget_id = get_objectid_for_budget(budget_uuid)
        future_transactions = get_scheduled_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)
        accounts = get_accounts_for_budget(budget_id)
        projected_balances = project_daily_balances_with_reasons(accounts, categories, future_transactions, 300)
    except Exception as e:
        return f"Error fetching data: {str(e)}", 500

    # Step 3: Prepare data for Plotly with detailed hover info
    dates = list(projected_balances.keys())
    balances = [float(projected_balances[date]["balance"].replace("€", "")) for date in dates]

    # Generate hover text with balance and change details for each date
    hover_texts = []
    for date in dates:
        day_data = projected_balances[date]
        balance = day_data["balance"]
        changes = day_data["changes"]

        # Prepare a hover text with balance and each change
        hover_text = f"Date: {date}<br>Balance: {balance}"
        if changes:
            hover_text += "<br>Changes:"
            for change in changes:
                hover_text += f"<br>- {change['amount']} ({change['category']} - {change['reason']})"
        hover_texts.append(hover_text)

    # Prepare plot data with the hover text
    plot_data = [{
        "x": dates,
        "y": balances,
        "type": "scatter",
        "mode": "lines+markers",
        "name": "Balance",
        "text": hover_texts,  # Attach hover text
        "hoverinfo": "text"   # Use the custom text for hover display
    }]

    # Convert plot data to JSON for the template
    sanitized_plot_data = json.dumps(plot_data)

    # Render HTML template with plot data
    return render_template('balance_projection.html', plot_data=sanitized_plot_data)

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
