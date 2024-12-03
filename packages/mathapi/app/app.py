import os
import itertools
from flask import Flask, jsonify, request, render_template
from ynab_api import get_scheduled_transactions
from categories_api import get_categories_for_budget
from budget_api import get_objectid_for_budget
from accounts_api import get_accounts_for_budget
from prediction_api import project_daily_balances_with_reasons, projected_balances_for_budget
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

def load_simulations_folder(folder_name="simulations"):
    """Load all simulations from a folder containing JSON files."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    folder_path = os.path.join(base_dir, folder_name)
    
    simulations = {}
    if not os.path.exists(folder_path):
        logging.warning(f"Simulation folder not found: {folder_path}")
        return simulations

    for file_name in os.listdir(folder_path):
        if file_name.endswith('.json'):
            file_path = os.path.join(folder_path, file_name)
            try:
                with open(file_path, "r") as file:
                    simulations[file_name] = json.load(file)
            except Exception as e:
                logging.warning(f"Failed to load simulation file {file_name}: {str(e)}")
    return simulations

def generate_unique_colors():
    """Generate unique colors for the plots."""
    colors = itertools.cycle(["red", "green", "blue", "purple", "orange", "cyan", "magenta"])
    for color in colors:
        yield color

@app.route('/balance-prediction/interactive', methods=['GET'])
def balance_prediction_interactive():
    # Step 1: Get `budget_id` from query parameters
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return "budget_id query parameter is required", 400

    # Step 2: Load simulations from folder
    simulations = load_simulations_folder()

    # Step 3: Fetch base data (no simulation)
    try:
        base_projected_balances = projected_balances_for_budget(budget_uuid, 300, None)
    except Exception as e:
        return f"Error fetching base data: {str(e)}", 500

    # Step 4: Prepare Plotly data for the base line
    dates = list(base_projected_balances.keys())
    base_balances = [float(base_projected_balances[date]["balance"].replace("€", "")) for date in dates]
    base_hover_texts = []
    for date in dates:
        day_data = base_projected_balances[date]
        balance = day_data["balance"]
        changes = day_data["changes"]
        hover_text = f"Date: {date}<br>Balance: {balance}"
        if changes:
            hover_text += "<br>Changes:"
            for change in changes:
                hover_text += f"<br>{change['amount']} ({change['category']} - {change['reason']})"
        base_hover_texts.append(hover_text)

    # Add base line to the plot
    plot_data = [{
        "x": dates,
        "y": base_balances,
        "type": "scatter",
        "mode": "lines+markers",
        "name": "Actual Balance",
        "text": base_hover_texts,
        "hoverinfo": "text",
        "marker": {"color": "black"}  # Black for the base line
    }]

    # Step 5: Add lines for simulations
    color_generator = generate_unique_colors()
    for simulation_file, simulation_data in simulations.items():
        try:
            simulated_balances = projected_balances_for_budget(budget_uuid, 300, simulation_data)
        except Exception as e:
            logging.warning(f"Error processing simulation file {simulation_file}: {str(e)}")
            continue

        # Prepare data for the simulation line
        simulation_dates = list(simulated_balances.keys())
        simulation_y = [float(simulated_balances[date]["balance"].replace("€", "")) for date in simulation_dates]
        simulation_hover_texts = []
        for date in simulation_dates:
            day_data = simulated_balances[date]
            balance = day_data["balance"]
            changes = day_data["changes"]
            hover_text = f"Date: {date}<br>Balance: {balance}"
            if changes:
                hover_text += "<br>Changes:"
                for change in changes:
                    simulation_flag = "(Simulation)" if change.get("is_simulation", False) else ""
                    hover_text += f"<br>{change['amount']} ({change['category']} - {change['reason']}) {simulation_flag}"
            simulation_hover_texts.append(hover_text)

        # Add the simulation line
        plot_data.append({
            "x": simulation_dates,
            "y": simulation_y,
            "type": "scatter",
            "mode": "lines+markers",
            "name": f"Simulation ({simulation_file})",
            "text": simulation_hover_texts,
            "hoverinfo": "text",
            "marker": {"color": next(color_generator)}  # Unique color for each simulation
        })

    # Convert plot data to JSON for the template
    sanitized_plot_data = json.dumps(plot_data)

    # Render HTML template with plot data
    return render_template('balance_projection.html', plot_data=sanitized_plot_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
