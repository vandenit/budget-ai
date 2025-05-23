from .ynab_api import fetch, get_uncategorized_transactions
from .ai_api import suggest_category, suggest_categories_batch, suggest_categories_batch_async, get_batch_status_and_results, parse_category_suggestions
from .categories_api import get_categories_for_budget
from .budget_api import get_objectid_for_budget, convert_objectid_to_str
import logging

def apply_suggested_categories_service(budget_uuid):
    """Fetch uncategorized transactions, suggest categories, and update them in YNAB."""
    try:
        # Fetch budget ID and uncategorized transactions
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        if not uncategorized_transactions:
            return {"message": "No uncategorized transactions found"}

        updated_transactions = []

        for transaction in uncategorized_transactions:
            try:
                # Suggest a category using AI
                suggested_category_name = suggest_category(transaction, categories)
                suggested_category = next(
                    (cat for cat in categories if cat["name"] == suggested_category_name), None
                )

                if not suggested_category:
                    logging.warning(f"No matching category found for transaction: {transaction['id']}")
                    continue

                # Update transaction in YNAB
                print (f"Updating transaction {transaction['id']} with category {suggested_category}")
                transaction_id = transaction["id"]
                memo = transaction.get("memo") or ""  # Ensure memo is a string
                updated_memo = f"{memo} AI suggested".strip()   

                path = f"budgets/{budget_uuid}/transactions/{transaction_id}"
                body = {
                    "transaction": {
                        "category_id": suggested_category["uuid"],
                        "approved": True,
                        "flag_color": "blue",
                        "memo": updated_memo
                    }
                }
                result = fetch("PUT", path, body)
                if "error" not in result:
                    updated_transactions.append({
                        "transaction_id": transaction_id,
                        "status": "updated",
                        "memo": updated_memo
                    })
                else:
                    logging.warning(f"Failed to update transaction {transaction_id}: {result['error']}")

            except Exception as e:
                logging.warning(f"Error processing transaction {transaction['id']}: {e}")
                continue

        return updated_transactions

    except Exception as e:
        logging.error(f"Error in apply_suggested_categories_service: {e}")
        raise


def apply_suggested_categories_batch_service(budget_uuid):
    """
    Fetch uncategorized transactions, suggest categories using batch processing, 
    and update them in YNAB. This is more cost-effective for larger numbers of transactions.
    """
    try:
        # Fetch budget ID and uncategorized transactions
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        if not uncategorized_transactions:
            return {"message": "No uncategorized transactions found"}

        logging.info(f"Processing {len(uncategorized_transactions)} uncategorized transactions using batch API")
        
        # Use batch processing to get all category suggestions at once
        category_suggestions = suggest_categories_batch(uncategorized_transactions, categories)
        
        updated_transactions = []
        failed_transactions = []

        for transaction in uncategorized_transactions:
            try:
                transaction_id = transaction["id"]
                suggested_category_name = category_suggestions.get(transaction_id)
                
                if not suggested_category_name:
                    logging.warning(f"No category suggestion received for transaction: {transaction_id}")
                    failed_transactions.append({
                        "transaction_id": transaction_id,
                        "error": "No category suggestion received"
                    })
                    continue

                # Find the matching category
                suggested_category = next(
                    (cat for cat in categories if cat["name"] == suggested_category_name), None
                )

                if not suggested_category:
                    logging.warning(f"No matching category found for suggestion '{suggested_category_name}' for transaction: {transaction_id}")
                    failed_transactions.append({
                        "transaction_id": transaction_id,
                        "error": f"Category '{suggested_category_name}' not found"
                    })
                    continue

                # Update transaction in YNAB
                logging.info(f"Updating transaction {transaction_id} with category {suggested_category['name']}")
                memo = transaction.get("memo") or ""  # Ensure memo is a string
                updated_memo = f"{memo} AI batch suggested".strip()   

                path = f"budgets/{budget_uuid}/transactions/{transaction_id}"
                body = {
                    "transaction": {
                        "category_id": suggested_category["uuid"],
                        "approved": True,
                        "flag_color": "green",  # Different color to distinguish batch processing
                        "memo": updated_memo
                    }
                }
                result = fetch("PUT", path, body)
                if "error" not in result:
                    updated_transactions.append({
                        "transaction_id": transaction_id,
                        "status": "updated",
                        "suggested_category": suggested_category_name,
                        "memo": updated_memo
                    })
                else:
                    logging.warning(f"Failed to update transaction {transaction_id}: {result['error']}")
                    failed_transactions.append({
                        "transaction_id": transaction_id,
                        "error": result['error']
                    })

            except Exception as e:
                logging.warning(f"Error processing transaction {transaction['id']}: {e}")
                failed_transactions.append({
                    "transaction_id": transaction.get('id', 'unknown'),
                    "error": str(e)
                })
                continue

        return {
            "updated_transactions": updated_transactions,
            "failed_transactions": failed_transactions,
            "total_processed": len(uncategorized_transactions),
            "total_updated": len(updated_transactions),
            "total_failed": len(failed_transactions)
        }

    except Exception as e:
        logging.error(f"Error in apply_suggested_categories_batch_service: {e}")
        raise


def suggest_categories_only_batch_service(budget_uuid):
    """
    Fetch uncategorized transactions and suggest categories using batch processing,
    but don't update them in YNAB. Returns suggestions for review.
    """
    try:
        # Fetch budget ID and uncategorized transactions
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        if not uncategorized_transactions:
            return {"message": "No uncategorized transactions found"}

        logging.info(f"Suggesting categories for {len(uncategorized_transactions)} transactions using batch API")
        
        # Use batch processing to get all category suggestions at once
        category_suggestions = suggest_categories_batch(uncategorized_transactions, categories)
        
        suggested_transactions = []

        for transaction in uncategorized_transactions:
            transaction_id = transaction["id"]
            suggested_category_name = category_suggestions.get(transaction_id)
            
            suggested_transactions.append({
                "transaction_id": transaction_id,
                "payee_name": transaction["payee_name"],
                "amount": transaction["amount"],
                "date": transaction["date"],
                "suggested_category_name": suggested_category_name or "No suggestion"
            })

        return {
            "suggested_transactions": suggested_transactions,
            "total_processed": len(uncategorized_transactions)
        }

    except Exception as e:
        logging.error(f"Error in suggest_categories_only_batch_service: {e}")
        raise


def start_batch_categorization_job(budget_uuid):
    """
    Start a batch categorization job asynchronously.
    Returns the batch job ID for later status checking.
    """
    try:
        # Fetch budget ID and uncategorized transactions
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        if not uncategorized_transactions:
            return {"message": "No uncategorized transactions found", "batch_id": None}

        logging.info(f"Starting batch job for {len(uncategorized_transactions)} uncategorized transactions")
        
        # Start batch processing (don't wait for completion)
        batch_id = suggest_categories_batch_async(uncategorized_transactions, categories)
        
        if not batch_id:
            return {"error": "Failed to start batch job", "batch_id": None}

        return {
            "message": f"Batch job started for {len(uncategorized_transactions)} transactions",
            "batch_id": batch_id,
            "total_transactions": len(uncategorized_transactions)
        }

    except Exception as e:
        logging.error(f"Error starting batch categorization job: {e}")
        raise


def check_batch_job_status(batch_id):
    """
    Check the status of a batch categorization job.
    """
    try:
        status, results, error_message = get_batch_status_and_results(batch_id)
        
        return {
            "batch_id": batch_id,
            "status": status,
            "has_results": results is not None,
            "error_message": error_message
        }

    except Exception as e:
        logging.error(f"Error checking batch job status: {e}")
        return {
            "batch_id": batch_id,
            "status": "error",
            "has_results": False,
            "error_message": str(e)
        }


def apply_batch_results_to_ynab(budget_uuid, batch_id):
    """
    Retrieve batch job results and apply them to YNAB transactions.
    Only works if the batch job is completed.
    """
    try:
        # Check if batch job is completed and get results
        status, batch_results, error_message = get_batch_status_and_results(batch_id)
        
        if status != "completed":
            return {
                "error": f"Batch job not completed. Status: {status}",
                "status": status,
                "error_message": error_message
            }

        if not batch_results:
            return {"error": "No results available from batch job"}

        # Fetch current data
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        # Parse batch results
        category_suggestions = parse_category_suggestions(batch_results, uncategorized_transactions)
        
        updated_transactions = []
        failed_transactions = []

        for transaction in uncategorized_transactions:
            try:
                transaction_id = transaction["id"]
                suggested_category_name = category_suggestions.get(transaction_id)
                
                if not suggested_category_name:
                    failed_transactions.append({
                        "transaction_id": transaction_id,
                        "error": "No category suggestion received"
                    })
                    continue

                # Find the matching category
                suggested_category = next(
                    (cat for cat in categories if cat["name"] == suggested_category_name), None
                )

                if not suggested_category:
                    failed_transactions.append({
                        "transaction_id": transaction_id,
                        "error": f"Category '{suggested_category_name}' not found"
                    })
                    continue

                # Update transaction in YNAB
                logging.info(f"Updating transaction {transaction_id} with category {suggested_category['name']}")
                memo = transaction.get("memo") or ""
                updated_memo = f"{memo} AI batch applied".strip()   

                path = f"budgets/{budget_uuid}/transactions/{transaction_id}"
                body = {
                    "transaction": {
                        "category_id": suggested_category["uuid"],
                        "approved": True,
                        "flag_color": "purple",  # Purple for async batch processing
                        "memo": updated_memo
                    }
                }
                result = fetch("PUT", path, body)
                if "error" not in result:
                    updated_transactions.append({
                        "transaction_id": transaction_id,
                        "status": "updated",
                        "suggested_category": suggested_category_name,
                        "memo": updated_memo
                    })
                else:
                    failed_transactions.append({
                        "transaction_id": transaction_id,
                        "error": result['error']
                    })

            except Exception as e:
                failed_transactions.append({
                    "transaction_id": transaction.get('id', 'unknown'),
                    "error": str(e)
                })
                continue

        return {
            "batch_id": batch_id,
            "updated_transactions": updated_transactions,
            "failed_transactions": failed_transactions,
            "total_updated": len(updated_transactions),
            "total_failed": len(failed_transactions)
        }

    except Exception as e:
        logging.error(f"Error applying batch results to YNAB: {e}")
        raise
