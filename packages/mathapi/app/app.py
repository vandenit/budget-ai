import os
import itertools
from flask import Flask, jsonify, request, render_template
from .ynab_service import (
    apply_suggested_categories_service, 
    apply_suggested_categories_batch_service,
    suggest_categories_only_batch_service,
    start_batch_categorization_job,
    check_batch_job_status,
    apply_batch_results_to_ynab,
    apply_suggested_categories_smart_service,
    suggest_categories_only_smart_service
)
from .ynab_api import get_scheduled_transactions, get_uncategorized_transactions
from .categories_api import get_categories_for_budget
from .budget_api import get_objectid_for_budget
from .accounts_api import get_accounts_for_budget
from .prediction_api import project_daily_balances_with_reasons
from .categories_api import get_categories_for_budget
from .ai_api import suggest_category
import logging
import json
from flask_cors import CORS
from dotenv import load_dotenv
from app.auth import requires_auth
from app.models import get_user_from_request, get_budget

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Setup CORS
CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, resources={
    r"/*": {
        "origins": CORS_ORIGINS,
        "methods": ["GET", "POST", "PUT", "OPTIONS"],
        "allow_headers": ["Authorization", "Content-Type"],
        "supports_credentials": True
    }
})

def load_simulations_folder(folder_name="simulations"):
    """Load all simulations from a folder containing JSON files."""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    folder_path = os.path.join(base_dir, folder_name)
    
    simulations = {"Actual Balance": None}  # Treat the baseline as a default simulation
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
    yield "black"  # First color for the baseline
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
    # Handle optional days_ahead parameter
    days_ahead_param = request.args.get('days_ahead')
    try:
        days_ahead = int(days_ahead_param) if days_ahead_param is not None else 300
    except ValueError:
        return "Invalid days_ahead query parameter, it must be an integer.", 400

    # Step 3: Fetch required data
    try:
        budget_id = get_objectid_for_budget(budget_uuid)
        future_transactions = get_scheduled_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)
        accounts = get_accounts_for_budget(budget_id)
    except Exception as e:
        return f"Error fetching data: {str(e)}", 500

    # Step 4: Generate plot data for the baseline and all simulations
    plot_data = []
    color_generator = generate_unique_colors()
    for simulation_name, simulation_data in simulations.items():
        try:
            # Get projected balances with raw numeric data
            projected_balances = project_daily_balances_with_reasons(
                accounts, categories, future_transactions, days_ahead, simulation_data
            )
        except Exception as e:
            logging.warning(f"Error processing simulation '{simulation_name}': {str(e)}")
            continue

        # Prepare data for the plot
        dates = list(projected_balances.keys())
        balances = [projected_balances[date]["balance"] for date in dates]  # Raw numbers
        hover_texts = []

        # Calculate hover text for each date
        for i, date in enumerate(dates):
            day_data = projected_balances[date]
            balance = day_data["balance"]  # Raw balance
            balance_diff = day_data.get("balance_diff", 0)  # Raw difference
            changes = day_data["changes"]

            # Format numbers for presentation
            hover_text = f"Date: {date}<br>Balance: {balance:.2f}€<br>Balance Difference: {balance_diff:.2f}€"
            if changes:
                hover_text += "<br>Changes:"
                for change in changes:
                    amount = change["amount"]  # Raw amount
                    if amount == 0:  # Skip zero-value changes
                        continue
                    simulation_flag = "(Simulation)" if change.get("is_simulation", False) else ""
                    hover_text += f"<br>{amount:.2f}€ ({change['category']} - {change['reason']}) {simulation_flag}"
            hover_texts.append(hover_text)

        # Add the line to the plot
        plot_data.append({
            "x": dates,
            "y": balances,
            "type": "scatter",
            "mode": "lines+markers",
            "name": simulation_name,
            "text": hover_texts,
            "hoverinfo": "text",
            "marker": {"color": next(color_generator)}
        })

    # Convert plot data to JSON for the template
    sanitized_plot_data = json.dumps(plot_data)

    # Render HTML template with plot data
    return render_template('balance_projection.html', plot_data=sanitized_plot_data)

@app.route('/balance-prediction/data')
@requires_auth
def get_prediction():
    """Get balance prediction for a budget."""
    try:
        user = get_user_from_request(request)
        if not user:
            return jsonify({"message": "User not found"}), 401
            
        budget_uuid = request.args.get('budget_id')
        if not budget_uuid:
            return jsonify({"message": "No budget_id provided"}), 400
            
        days_ahead = int(request.args.get('days_ahead', 300))
        
        # First get the MongoDB ObjectId for the budget
        budget_id = get_objectid_for_budget(budget_uuid)
        if not budget_id:
            return jsonify({"message": "Budget not found"}), 404
            
        # Then get the full budget document and verify ownership
        budget = get_budget(budget_uuid, user)
        if not budget:
            return jsonify({"message": "Budget not found or access denied"}), 404
            
        # Get YNAB connection details
        ynab_connection = user.get('ynab', {}).get('connection', {})
        if not ynab_connection:
            return jsonify({"message": "No YNAB connection"}), 400
            
        # Load simulations
        simulations = load_simulations_folder()
        
        # Fetch required data
        future_transactions = get_scheduled_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)
        accounts = get_accounts_for_budget(budget_id)

        # Process each simulation and collect results
        results = {}
        for simulation_name, simulation_data in simulations.items():
            try:
                projected_balances = project_daily_balances_with_reasons(
                    accounts, categories, future_transactions, days_ahead, simulation_data
                )
                results[simulation_name] = projected_balances
            except Exception as e:
                logger.warning(f"Error processing simulation '{simulation_name}': {str(e)}")
                continue

        return jsonify(results)
        
    except ValueError as e:
        logger.warning(f"Invalid input: {str(e)}")
        return jsonify({"message": str(e)}), 400
    except Exception as e:
        logger.error(f"Error generating prediction: {str(e)}")
        return jsonify({"message": "Internal server error"}), 500

@app.route('/health')
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})

@app.route('/sheduled-transactions', methods=['GET'])
def get_scheduled_transactions_route():
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return "budget_id query parameter is required", 400

    try:
        transactions = get_scheduled_transactions(budget_uuid)
        return jsonify(transactions)
    except Exception as e:
        return f"Error fetching scheduled transactions: {str(e)}", 500
    
@app.route('/uncategorised-transactions/suggest-categories', methods=['GET'])
def suggest_categories_for_unscheduled_transactions():
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        # Fetch budget ID and data
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)
    except Exception as e:
        return jsonify({"error": f"Error fetching data: {str(e)}"}), 500

    if not uncategorized_transactions:
        return jsonify([])  # No uncategorized transactions found

    # Suggest categories for each uncategorized transaction
    suggested_transactions = []
    for transaction in uncategorized_transactions:
        try:
            suggested_category_name = suggest_category(transaction, categories, budget_uuid)
            suggested_transactions.append({
                "transaction_id": transaction["id"],
                "payee_name": transaction["payee_name"],
                "amount": transaction["amount"],
                "date": transaction["date"],
                "suggested_category_name": suggested_category_name
            })
        except Exception as e:
             return jsonify({"error": f"Error fetching data: {str(e)}"}), 500

    return jsonify(suggested_transactions)

@app.route('/uncategorised-transactions/apply-categories', methods=['POST'])
def apply_suggested_categories():
    """Fetch transactions, suggest categories, and apply them."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        # Delegate business logic to the service layer
        result = apply_suggested_categories_service(budget_uuid)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error applying categories: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/uncategorised-transactions/suggest-categories-batch', methods=['GET'])
def suggest_categories_batch_endpoint():
    """Suggest categories for uncategorized transactions using batch processing (more cost-effective)."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        # Use the new batch service
        result = suggest_categories_only_batch_service(budget_uuid)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error suggesting categories with batch processing: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/uncategorised-transactions/apply-categories-batch', methods=['POST'])
def apply_suggested_categories_batch():
    """Fetch transactions, suggest categories using batch processing, and apply them (50% cost savings)."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        # Delegate business logic to the new batch service layer
        result = apply_suggested_categories_batch_service(budget_uuid)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error applying categories with batch processing: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/uncategorised-transactions/start-batch-job', methods=['POST'])
def start_batch_categorization():
    """Start a batch categorization job asynchronously and return the job ID."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        result = start_batch_categorization_job(budget_uuid)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error starting batch categorization job: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/batch-jobs/<batch_id>/status', methods=['GET'])
def get_batch_job_status(batch_id):
    """Check the status of a batch categorization job."""
    try:
        result = check_batch_job_status(batch_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error checking batch job status: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/batch-jobs/<batch_id>/apply-results', methods=['POST'])
def apply_batch_job_results(batch_id):
    """Apply the results of a completed batch job to YNAB transactions."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        result = apply_batch_results_to_ynab(budget_uuid, batch_id)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error applying batch job results: {e}")
        return jsonify({"error": str(e)}), 500

# Smart categorization endpoints (NEW - recommended for speed/cost balance)
@app.route('/uncategorised-transactions/suggest-categories-smart', methods=['GET'])
def suggest_categories_smart_endpoint():
    """
    Smart category suggestions with configurable urgency.
    Query parameters:
    - budget_id: Budget UUID (required)
    - urgency: "immediate" (fast/expensive), "normal" (balanced), "economy" (slow/cheap)
    """
    try:
        budget_id = request.args.get('budget_id')
        if not budget_id:
            return jsonify({"error": "budget_id query parameter is required"}), 400
        
        urgency = request.args.get('urgency', 'normal')
        if urgency not in ['immediate', 'normal', 'economy']:
            return jsonify({"error": "urgency must be 'immediate', 'normal', or 'economy'"}), 400
        
        result = suggest_categories_only_smart_service(budget_id, urgency)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/uncategorised-transactions/apply-categories-smart', methods=['POST'])
def apply_categories_smart_endpoint():
    """
    Smart category application with configurable urgency.
    Query parameters:
    - budget_id: Budget UUID (required)
    - urgency: "immediate" (fast/expensive), "normal" (balanced), "economy" (slow/cheap)
    """
    try:
        budget_id = request.args.get('budget_id')
        if not budget_id:
            return jsonify({"error": "budget_id query parameter is required"}), 400
        
        urgency = request.args.get('urgency', 'normal')
        if urgency not in ['immediate', 'normal', 'economy']:
            return jsonify({"error": "urgency must be 'immediate', 'normal', or 'economy'"}), 400
        
        result = apply_suggested_categories_smart_service(budget_id, urgency)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Payee Mappings Management Endpoints (NEW - for learning user patterns)
@app.route('/payee-mappings/<budget_id>', methods=['GET'])
def get_payee_mappings(budget_id):
    """Get all payee mappings for a budget."""
    try:
        from .payee_mappings_mongo import MongoPayeeMappingsManager
        mappings_manager = MongoPayeeMappingsManager(budget_id)
        mappings = mappings_manager.get_all_mappings()
        
        return jsonify({
            "budget_id": budget_id,
            "mappings": mappings,
            "total_mappings": len(mappings)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/payee-mappings/<budget_id>', methods=['POST'])
def add_payee_mapping(budget_id):
    """Add a new payee mapping."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "JSON body is required"}), 400
        
        payee_name = data.get('payee_name')
        category_name = data.get('category_name')
        country_code = data.get('country_code')  # Optional country override
        
        if not payee_name or not category_name:
            return jsonify({"error": "payee_name and category_name are required"}), 400
        
        from .payee_mappings_mongo import MongoPayeeMappingsManager
        mappings_manager = MongoPayeeMappingsManager(budget_id, country_code)
        success = mappings_manager.add_mapping(payee_name, category_name)
        
        if success:
            return jsonify({
                "message": f"Added mapping: '{payee_name}' → '{category_name}'",
                "payee_name": payee_name,
                "category_name": category_name,
                "country_code": country_code
            })
        else:
            return jsonify({"error": "Failed to add mapping"}), 500
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/payee-mappings/<budget_id>/<payee_name>', methods=['DELETE'])
def remove_payee_mapping(budget_id, payee_name):
    """Remove a payee mapping."""
    try:
        from .payee_mappings_mongo import MongoPayeeMappingsManager
        mappings_manager = MongoPayeeMappingsManager(budget_id)
        success = mappings_manager.remove_mapping(payee_name)
        
        if success:
            return jsonify({
                "message": f"Removed mapping for '{payee_name}'"
            })
        else:
            return jsonify({"error": f"Mapping for '{payee_name}' not found"}), 404
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/payee-mappings/<budget_id>/search', methods=['GET'])
def search_payee_mapping(budget_id):
    """Search for payee mapping (exact or fuzzy)."""
    try:
        payee_name = request.args.get('payee_name')
        country_code = request.args.get('country_code')  # Optional country override
        
        if not payee_name:
            return jsonify({"error": "payee_name query parameter is required"}), 400
        
        from .payee_mappings_mongo import MongoPayeeMappingsManager
        mappings_manager = MongoPayeeMappingsManager(budget_id, country_code)
        
        # Try exact match first
        exact_match = mappings_manager.get_exact_mapping(payee_name)
        if exact_match:
            return jsonify({
                "payee_name": payee_name,
                "category_name": exact_match,
                "match_type": "exact",
                "country_code": mappings_manager._get_country_for_payee(payee_name)
            })
        
        # Try fuzzy match
        fuzzy_match = mappings_manager.get_fuzzy_mapping(payee_name)
        if fuzzy_match:
            matched_payee, category, score = fuzzy_match
            return jsonify({
                "payee_name": payee_name,
                "category_name": category,
                "match_type": "fuzzy",
                "matched_payee": matched_payee,
                "similarity_score": score,
                "country_code": mappings_manager._get_country_for_payee(payee_name)
            })
        
        return jsonify({
            "payee_name": payee_name,
            "category_name": None,
            "match_type": "none",
            "country_code": mappings_manager._get_country_for_payee(payee_name)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/payee-mappings/<budget_id>/stats', methods=['GET'])
def get_payee_mapping_stats(budget_id):
    """Get statistics about payee mappings for a budget."""
    try:
        from .payee_mappings_mongo import MongoPayeeMappingsManager
        mappings_manager = MongoPayeeMappingsManager(budget_id)
        stats = mappings_manager.get_mapping_stats()
        
        return jsonify(stats)
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Country Configuration Management Endpoints (NEW - for multi-country support)
@app.route('/config/countries', methods=['GET'])
def get_available_countries():
    """Get list of all available countries and their configuration status."""
    try:
        from .country_config_loader import get_config_loader
        config_loader = get_config_loader()
        
        countries = config_loader.get_available_countries()
        default_country = config_loader.get_default_country()
        config_loaded = config_loader.is_config_loaded_successfully()
        
        return jsonify({
            "countries": countries,
            "default_country": default_country,
            "config_loaded_successfully": config_loaded,
            "total_countries": len(countries)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/config/countries/<country_code>', methods=['GET'])
def get_country_config(country_code):
    """Get detailed configuration for a specific country."""
    try:
        from .country_config_loader import get_config_loader
        config_loader = get_config_loader()
        
        country_config = config_loader.get_country_config(country_code)
        bank_indicators = config_loader.get_all_bank_indicators(country_code)
        bank_prefixes = config_loader.get_all_bank_prefixes(country_code)
        
        return jsonify({
            "country_code": country_code.upper(),
            "config": country_config,
            "bank_indicators": bank_indicators,
            "bank_prefixes": bank_prefixes
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/config/detect-country', methods=['POST'])
def detect_country_from_payee():
    """Detect country from a payee name."""
    try:
        data = request.get_json()
        if not data or 'payee_name' not in data:
            return jsonify({"error": "payee_name is required in JSON body"}), 400
        
        payee_name = data['payee_name']
        
        from .country_config_loader import get_config_loader
        config_loader = get_config_loader()
        
        detected_country = config_loader.detect_country_from_payee(payee_name)
        
        # Also show preprocessing result
        from .payee_mappings_mongo import MongoPayeeMappingsManager
        manager = MongoPayeeMappingsManager('demo', detected_country)
        preprocessed = manager.test_preprocessing(payee_name)
        
        return jsonify({
            "payee_name": payee_name,
            "detected_country": detected_country,
            "preprocessed_name": preprocessed,
            "country_name": config_loader.get_country_config(detected_country).get('name', detected_country)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/config/reload', methods=['POST'])
def reload_country_config():
    """Reload country configuration from file."""
    try:
        from .country_config_loader import get_config_loader
        config_loader = get_config_loader()
        config_loader.reload_config()
        
        return jsonify({
            "message": "Configuration reloaded successfully",
            "config_loaded_successfully": config_loader.is_config_loaded_successfully(),
            "available_countries": len(config_loader.get_available_countries())
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
