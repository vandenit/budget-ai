import os
import itertools
from flask import Flask, jsonify, request, render_template
from .ynab_service import (
    apply_suggested_categories_service,
    apply_all_categories_service,
    get_cached_suggestions_service,
    get_suggestions_async_service
)
from .ynab_api import get_scheduled_transactions, get_uncategorized_transactions, fetch, get_unapproved_transactions
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

@app.route('/uncategorised-transactions', methods=['GET'])
def get_uncategorised_transactions():
    """Get uncategorised transactions with any existing AI suggestions for immediate loading."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        # Get uncategorized transactions immediately (fast)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)

        if not uncategorized_transactions:
            return jsonify([])

        # Check for existing AI suggestions using simple cache
        try:
            from .ai_suggestions_simple import SimpleAISuggestionsService
            cache_service = SimpleAISuggestionsService(budget_uuid)
            transaction_ids = [tx["id"] for tx in uncategorized_transactions]
            cached_suggestions = cache_service.get_cached_suggestions_batch(transaction_ids)
        except Exception as e:
            logging.warning(f"Failed to load cached suggestions: {e}")
            cached_suggestions = {}

        # Return transactions with existing suggestions (if any)
        transactions = []
        for transaction in uncategorized_transactions:
            transaction_id = transaction["id"]
            existing_suggestion = cached_suggestions.get(transaction_id)

            transactions.append({
                "transaction_id": transaction_id,
                "payee_name": transaction["payee_name"],
                "amount": transaction["amount"],
                "date": transaction["date"],
                "memo": transaction.get("memo", ""),
                "suggested_category_name": existing_suggestion,
                "loading_suggestion": existing_suggestion is None,  # Only load if no existing suggestion
                "cached": existing_suggestion is not None
            })

        logging.info(f"Returned {len(transactions)} transactions with {len(cached_suggestions)} existing AI suggestions")
        return jsonify(transactions)

    except Exception as e:
        logging.error(f"Error fetching uncategorised transactions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/unapproved-transactions', methods=['GET'])
@requires_auth
def get_unapproved_transactions_endpoint():
    """Get unapproved transactions for a budget."""
    try:
        user = get_user_from_request(request)
        if not user:
            return jsonify({"message": "User not found"}), 401

        budget_uuid = request.args.get('budget_id')
        if not budget_uuid:
            return jsonify({"error": "budget_id query parameter is required"}), 400

        # Verify budget ownership
        budget = get_budget(budget_uuid, user)
        if not budget:
            return jsonify({"message": "Budget not found or access denied"}), 404

        # Get unapproved transactions
        unapproved_transactions = get_unapproved_transactions(budget_uuid)

        if not unapproved_transactions:
            return jsonify([])

        # Return transactions in a format similar to uncategorized transactions
        transactions = []
        for transaction in unapproved_transactions:
            transactions.append({
                "transaction_id": transaction["id"],
                "payee_name": transaction.get("payee_name", ""),
                "amount": transaction["amount"],
                "date": transaction["date"],
                "memo": transaction.get("memo", ""),
                "category_name": transaction.get("category_name"),
                "category_id": transaction.get("category_id"),
                "approved": transaction.get("approved", False)
            })

        logging.info(f"Returned {len(transactions)} unapproved transactions")
        return jsonify(transactions)

    except Exception as e:
        logging.error(f"Error fetching unapproved transactions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/uncategorised-transactions/suggest-categories', methods=['GET'])
def suggest_categories_for_unscheduled_transactions():
    """Suggest categories for uncategorized transactions, using cache first."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        # Fetch budget ID and data
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        if not uncategorized_transactions:
            return jsonify([])  # No uncategorized transactions found

        # Check for existing AI suggestions first
        try:
            from .ai_suggestions_simple import SimpleAISuggestionsService
            cache_service = SimpleAISuggestionsService(budget_uuid)
            transaction_ids = [tx["id"] for tx in uncategorized_transactions]
            cached_suggestions = cache_service.get_cached_suggestions_batch(transaction_ids)
        except Exception as e:
            logging.warning(f"Failed to load cached suggestions: {e}")
            cached_suggestions = {}

        # Suggest categories for each uncategorized transaction
        suggested_transactions = []
        new_suggestions = []

        for transaction in uncategorized_transactions:
            transaction_id = transaction["id"]

            # Use cached suggestion if available
            existing_suggestion = cached_suggestions.get(transaction_id)
            if existing_suggestion:
                suggested_transactions.append({
                    "transaction_id": transaction_id,
                    "payee_name": transaction["payee_name"],
                    "amount": transaction["amount"],
                    "date": transaction["date"],
                    "suggested_category_name": existing_suggestion,
                    "cached": True
                })
            else:
                # Generate new suggestion
                try:
                    suggested_category_name = suggest_category(transaction, categories, budget_uuid)
                    suggested_transactions.append({
                        "transaction_id": transaction_id,
                        "payee_name": transaction["payee_name"],
                        "amount": transaction["amount"],
                        "date": transaction["date"],
                        "suggested_category_name": suggested_category_name,
                        "cached": False
                    })

                    # Prepare for caching
                    new_suggestions.append({
                        "transaction_id": transaction_id,
                        "payee_name": transaction["payee_name"],
                        "suggested_category": suggested_category_name,
                        "confidence": 0.8
                    })

                except Exception as e:
                    logging.warning(f"Failed to generate suggestion for transaction {transaction_id}: {e}")
                    suggested_transactions.append({
                        "transaction_id": transaction_id,
                        "payee_name": transaction["payee_name"],
                        "amount": transaction["amount"],
                        "date": transaction["date"],
                        "suggested_category_name": "Error generating suggestion",
                        "cached": False
                    })

        # Cache new suggestions
        if new_suggestions:
            try:
                cached_count = cache_service.store_suggestions_batch(new_suggestions)
                logging.info(f"Cached {cached_count} new suggestions")
            except Exception as e:
                logging.warning(f"Failed to cache new suggestions: {e}")

        logging.info(f"Returned {len(suggested_transactions)} suggestions ({len(cached_suggestions)} from cache, {len(new_suggestions)} new)")
        return jsonify(suggested_transactions)

    except Exception as e:
        logging.error(f"Error suggesting categories: {e}")
        return jsonify({"error": str(e)}), 500

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

@app.route('/uncategorised-transactions/apply-all-categories', methods=['POST'])
def apply_all_categories():
    """Apply all categories (both AI suggestions and manual changes) and learn from manual changes."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        # Get the transactions data from request body
        data = request.get_json()
        if not data or 'transactions' not in data:
            return jsonify({"error": "transactions data is required in request body"}), 400

        transactions = data['transactions']

        # Delegate business logic to the service layer
        result = apply_all_categories_service(budget_uuid, transactions)
        return jsonify(result)
    except Exception as e:
        logging.error(f"Error applying all categories: {e}")
        return jsonify({"error": str(e)}), 500

# Batch and smart endpoints removed - not used by frontend

# Payee mappings are now internal-only (used by AI service, no public endpoints)

# Country configuration is now internal-only (used by payee mappings, no public endpoints)

@app.route('/uncategorised-transactions/suggestions-async', methods=['POST'])
def get_suggestions_async():
    """Get AI suggestions for specific transactions (progressive loading)."""
    logging.info(f"POST /suggestions-async called - query params: {dict(request.args)}")

    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        logging.warning("Missing budget_id query parameter")
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        # Get transaction IDs from request body
        data = request.get_json()
        logging.info(f"Request JSON data: {data}")

        if not data or 'transaction_ids' not in data:
            logging.warning(f"Invalid request body - data: {data}")
            return jsonify({"error": "transaction_ids required in request body"}), 400

        transaction_ids = data['transaction_ids']
        logging.info(f"Processing {len(transaction_ids)} transaction IDs for async suggestions")

        # Delegate to async service
        result = get_suggestions_async_service(budget_uuid, transaction_ids)
        return jsonify(result)

    except Exception as e:
        logging.error(f"Error getting async suggestions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/uncategorised-transactions/suggestions-cached', methods=['GET'])
def get_cached_suggestions():
    """Get cached AI suggestions for immediate display using simple cache in localtransactions."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        result = get_cached_suggestions_service(budget_uuid)
        return jsonify(result)

    except Exception as e:
        logging.error(f"Error getting cached suggestions: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/uncategorised-transactions/suggest-single', methods=['POST'])
def suggest_single_transaction():
    """Get AI suggestion for a single transaction (optimized for real-time UI)."""
    budget_uuid = request.args.get('budget_id')
    if not budget_uuid:
        return jsonify({"error": "budget_id query parameter is required"}), 400

    try:
        # Get transaction data from request body
        data = request.get_json()
        if not data or 'transaction_id' not in data:
            return jsonify({"error": "transaction_id required in request body"}), 400

        transaction_id = data['transaction_id']

        # Get transaction details - we might need to fetch it or it could be provided
        if 'transaction' in data:
            # Transaction details provided in request
            transaction = data['transaction']
        else:
            # Need to fetch transaction from YNAB API
            uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
            transaction = next((tx for tx in uncategorized_transactions if tx["id"] == transaction_id), None)

            if not transaction:
                return jsonify({"error": f"Transaction {transaction_id} not found"}), 404

        # Check cache first using simple cache
        try:
            from .ai_suggestions_simple import SimpleAISuggestionsService
            cache_service = SimpleAISuggestionsService(budget_uuid)
            cached_suggestion = cache_service.get_cached_suggestion(transaction_id)

            if cached_suggestion:
                return jsonify({
                    "transaction_id": transaction_id,
                    "suggested_category_name": cached_suggestion,
                    "confidence": 0.8,
                    "cached": True,
                    "processing_time_ms": 0
                })
        except Exception as e:
            logging.warning(f"Cache check failed for {transaction_id}: {e}")

        # Generate new suggestion
        budget_id = get_objectid_for_budget(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        import time
        start_time = time.time()

        suggested_category_name = suggest_category(transaction, categories, budget_uuid)

        processing_time = int((time.time() - start_time) * 1000)

        # Cache the new suggestion
        try:
            cache_service.store_suggestion(
                transaction_id,
                transaction["payee_name"],
                suggested_category_name,
                0.8
            )
        except Exception as e:
            logging.warning(f"Failed to cache suggestion for {transaction_id}: {e}")

        return jsonify({
            "transaction_id": transaction_id,
            "suggested_category_name": suggested_category_name,
            "confidence": 0.8,
            "cached": False,
            "processing_time_ms": processing_time
        })

    except Exception as e:
        logging.error(f"Error getting single suggestion: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/uncategorised-transactions/apply-single', methods=['POST'])
def apply_single_category():
    """Apply category for a single transaction."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        budget_uuid = request.args.get('budget_id')
        if not budget_uuid:
            return jsonify({"error": "budget_id query parameter is required"}), 400

        transaction_id = data.get('transaction_id')
        category_name = data.get('category_name')

        if not transaction_id or not category_name:
            return jsonify({"error": "transaction_id and category_name are required"}), 400

        # Fetch budget info to get ObjectId
        budget_id = get_objectid_for_budget(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        # Find the category ID by name
        category_id = None
        for cat in categories:
            if cat["name"].lower() == category_name.lower():
                category_id = cat["uuid"]
                break

        if not category_id:
            return jsonify({"error": f"Category '{category_name}' not found"}), 404

        # Check if this is a manual change and should be learned as a payee mapping
        is_manual_change = data.get('is_manual_change', False)
        learned_mapping = False

        if is_manual_change:
            # Get transaction details from YNAB to extract payee name
            try:
                ynab_path = f"budgets/{budget_uuid}/transactions/{transaction_id}"
                ynab_result = fetch("GET", ynab_path)
                transaction_data = ynab_result.get("data", {}).get("transaction", {})
                payee_name = transaction_data.get("payee_name", "")

                if payee_name and not payee_name.startswith("Transfer :"):
                    # Learn this as a payee mapping using MongoDB-based manager
                    from .payee_mappings_mongo import MongoPayeeMappingsManager
                    mappings_manager = MongoPayeeMappingsManager(budget_uuid)
                    mappings_manager.add_mapping(payee_name, category_name)
                    learned_mapping = True
                    logging.info(f"Learned payee mapping: '{payee_name}' → '{category_name}'")

            except Exception as e:
                logging.warning(f"Failed to learn payee mapping: {e}")

        # Update the transaction in YNAB
        try:
            memo_suffix = "manual" if is_manual_change else "AI single"
            flag_color = "purple" if is_manual_change else "green"  # Purple for manual, green for AI

            update_data = {
                "transaction": {
                    "category_id": category_id,
                    "approved": True,
                    "flag_color": flag_color,
                    "memo": f"AI: {category_name} ({memo_suffix})"
                }
            }

            fetch("PUT", f"budgets/{budget_uuid}/transactions/{transaction_id}", update_data)

            learning_message = " (learned for future)" if learned_mapping else ""
            logging.info(f"Successfully applied single category '{category_name}' to transaction {transaction_id}{learning_message}")

            return jsonify({
                "transaction_id": transaction_id,
                "category_name": category_name,
                "category_id": category_id,
                "success": True,
                "is_manual_change": is_manual_change,
                "learned_mapping": learned_mapping,
                "message": f"Applied '{category_name}' to transaction{learning_message}"
            })

        except Exception as e:
            logging.error(f"Failed to update transaction {transaction_id} in YNAB: {e}")
            return jsonify({"error": f"Failed to update transaction in YNAB: {str(e)}"}), 500

    except Exception as e:
        logging.error(f"Error applying single category: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/transactions/approve-single', methods=['POST'])
@requires_auth
def approve_single_transaction():
    """Approve a single transaction without changing category."""
    try:
        user = get_user_from_request(request)
        if not user:
            return jsonify({"message": "User not found"}), 401

        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        budget_uuid = request.args.get('budget_id')
        if not budget_uuid:
            return jsonify({"error": "budget_id query parameter is required"}), 400

        # Verify budget ownership
        budget = get_budget(budget_uuid, user)
        if not budget:
            return jsonify({"message": "Budget not found or access denied"}), 404

        transaction_id = data.get('transaction_id')

        if not transaction_id:
            return jsonify({"error": "transaction_id is required"}), 400

        # Update the transaction in YNAB to approve it (without changing category)
        try:
            update_data = {
                "transaction": {
                    "approved": True
                }
            }

            response = fetch("PUT", f"budgets/{budget_uuid}/transactions/{transaction_id}", update_data)

            if "error" in response:
                return jsonify({"error": f"Failed to approve transaction: {response['error']}"}), 500

            logging.info(f"Successfully approved transaction {transaction_id}")

            return jsonify({
                "transaction_id": transaction_id,
                "success": True,
                "message": "Transaction approved successfully"
            })

        except Exception as e:
            logging.error(f"Failed to approve transaction {transaction_id} in YNAB: {e}")
            return jsonify({"error": f"Failed to approve transaction in YNAB: {str(e)}"}), 500

    except Exception as e:
        logging.error(f"Error approving single transaction: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/transactions/approve-all', methods=['POST'])
@requires_auth
def approve_all_unapproved_transactions():
    """Approve all unapproved transactions for a budget."""
    try:
        user = get_user_from_request(request)
        if not user:
            return jsonify({"message": "User not found"}), 401

        budget_uuid = request.args.get('budget_id')
        if not budget_uuid:
            return jsonify({"error": "budget_id query parameter is required"}), 400

        # Verify budget ownership
        budget = get_budget(budget_uuid, user)
        if not budget:
            return jsonify({"message": "Budget not found or access denied"}), 404

        # Get all unapproved transactions
        unapproved_transactions = get_unapproved_transactions(budget_uuid)

        if not unapproved_transactions:
            return jsonify({
                "message": "No unapproved transactions found",
                "approved_count": 0
            })

        approved_count = 0
        failed_count = 0
        errors = []

        for transaction in unapproved_transactions:
            try:
                transaction_id = transaction["id"]

                update_data = {
                    "transaction": {
                        "approved": True
                    }
                }

                response = fetch("PUT", f"budgets/{budget_uuid}/transactions/{transaction_id}", update_data)

                if "error" not in response:
                    approved_count += 1
                else:
                    failed_count += 1
                    errors.append(f"Transaction {transaction_id}: {response['error']}")

            except Exception as e:
                failed_count += 1
                errors.append(f"Transaction {transaction.get('id', 'unknown')}: {str(e)}")

        logging.info(f"Approved {approved_count} transactions, {failed_count} failed")

        result = {
            "approved_count": approved_count,
            "failed_count": failed_count,
            "total_processed": len(unapproved_transactions),
            "success": failed_count == 0
        }

        if errors:
            result["errors"] = errors[:5]  # Limit to first 5 errors

        return jsonify(result)

    except Exception as e:
        logging.error(f"Error approving all transactions: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
