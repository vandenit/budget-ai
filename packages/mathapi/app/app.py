from flask import Flask, jsonify, request, render_template
from ynab_api import get_scheduled_transactions
from categories_api import get_categories_for_budget
from budget_api import get_objectid_for_budget
from accounts_api import get_accounts_for_budget
from prediction_api import project_daily_balances_with_reasons, projected_balances_for_budget
import logging
import json
import os

# Set up logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

def load_simulations(file_name="simulations.json"):
    """Load simulations from a JSON file relative to the app directory."""
    base_dir = os.path.dirname(os.path.abspath(__file__))  # Directory of the current file
    file_path = os.path.join(base_dir, file_name)
    
    if not os.path.exists(file_path):
        logging.warning(f"Simulation file not found: {file_path}")
        return []
    with open(file_path, "r") as file:
        return json.load(file)

@app.route('/balance_prediction', methods=['GET'])
def balance_prediction():
    budget_uuid = request.args.get('budget_id')
    logging.info(f"Getting balance prediction for budget ID: {budget_uuid}")
    
    # Check for required parameters
    if not budget_uuid:
        return jsonify({"error": "budget_id is required as query parameter"}), 400
    
    # Load simulations
    simulations = load_simulations()

    # Perform balance prediction logic here
    projected_balances = projected_balances_for_budget(budget_uuid, 300, simulations)

    # The projected_balances object is now JSON-compatible and can be rendered directly
    return jsonify(projected_balances)  # Flask's jsonify automatically converts to JSON format

@app.route('/balance-prediction/interactive', methods=['GET'])
def balance_prediction_interactive():
    # Step 1: Get `budget_id` from query parameters
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return "budget_id query parameter is required", 400

    # Load simulations
    simulations = load_simulations()

    # Step 2: Fetch data for predictions
    try:
        # Perform balance prediction logic here
        projected_balances = projected_balances_for_budget(budget_uuid, 300, simulations)

    except Exception as e:
        return f"Error fetching data: {str(e)}", 500

    # Step 3: Prepare data for Plotly with detailed hover info
    dates = list(projected_balances.keys())
    balances = [float(projected_balances[date]["balance"].replace("€", "")) for date in dates]

    # Generate hover text with balance and change details for each date
    hover_texts = []
    marker_colors = []  # To visually distinguish simulation points
    for date in dates:
        day_data = projected_balances[date]
        balance = day_data["balance"]
        changes = day_data["changes"]

        # Prepare a hover text with balance and each change
        hover_text = f"Date: {date}<br>Balance: {balance}"
        is_simulation_day = False  # Flag to check if this date has simulation changes
        if changes:
            hover_text += "<br>Changes:"
            for change in changes:
                simulation_flag = "(Simulation)" if change.get("is_simulation", False) else ""
                if change.get("is_simulation", False):
                    is_simulation_day = True
                hover_text += f"<br>{change['amount']} ({change['category']} - {change['reason']}) {simulation_flag}"
        hover_texts.append(hover_text)

        # Add marker color: red for simulations, blue for others
        marker_colors.append("red" if is_simulation_day else "blue")

    # Prepare plot data with the hover text
    plot_data = [{
        "x": dates,
        "y": balances,
        "type": "scatter",
        "mode": "lines+markers",
        "name": "Balance",
        "text": hover_texts,  # Attach hover text
        "hoverinfo": "text",  # Use the custom text for hover display
        "marker": {"color": marker_colors}  # Use colors to distinguish simulations
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
