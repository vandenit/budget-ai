from .ynab_api import fetch, get_uncategorized_transactions
from .ai_api import suggest_category, suggest_categories_batch, suggest_categories_batch_async, get_batch_status_and_results, parse_category_suggestions, suggest_categories_smart
from .categories_api import get_categories_for_budget
from .budget_api import get_objectid_for_budget, convert_objectid_to_str
from .payee_mappings_mongo import MongoPayeeMappingsManager
from .ai_suggestions_simple import SimpleAISuggestionsService
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

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
                suggested_category_name = suggest_category(transaction, categories, budget_uuid)
                suggested_category = next(
                    (cat for cat in categories if cat["name"] == suggested_category_name), None
                )

                if not suggested_category:
                    logging.warning(f"No matching category found for transaction: {transaction['id']}")
                    continue

                # Update transaction in YNAB
                print (f"Updating transaction {transaction['id']} with category {suggested_category}")
                transaction_id = transaction["id"]
                # Ensure memo is a string
                memo = transaction.get("memo") or ""
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
        category_suggestions = suggest_categories_batch(uncategorized_transactions, categories, budget_uuid)
        
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
                # Ensure memo is a string
                memo = transaction.get("memo") or ""
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
        category_suggestions = suggest_categories_batch(uncategorized_transactions, categories, budget_uuid)
        
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
        batch_id = suggest_categories_batch_async(uncategorized_transactions, categories, budget_uuid)
        
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
        category_suggestions = parse_category_suggestions(batch_results, uncategorized_transactions, categories)
        
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


def apply_suggested_categories_smart_service(budget_uuid, urgency="normal"):
    """
    Smart category suggestion and application with configurable urgency.
    
    urgency options:
    - "immediate": Force real-time processing (expensive but fast ~30 seconds)
    - "normal": Auto-choose based on transaction count (balanced)
    - "economy": Force batch processing (cheap but slow ~30 minutes to 24 hours)
    """
    try:
        # Fetch budget ID and uncategorized transactions
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        if not uncategorized_transactions:
            return {"message": "No uncategorized transactions found"}

        transaction_count = len(uncategorized_transactions)
        logging.info(f"Smart processing {transaction_count} uncategorized transactions with urgency='{urgency}'")
        
        # Use smart processing to get all category suggestions
        category_suggestions = suggest_categories_smart(uncategorized_transactions, categories, urgency, budget_uuid)
        
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
                memo = transaction.get("memo") or ""
                
                # Add different memo based on processing type
                if urgency == "immediate":
                    updated_memo = f"{memo} AI immediate".strip()
                    flag_color = "red"  # Red for immediate processing
                elif urgency == "economy":
                    updated_memo = f"{memo} AI economy".strip()
                    flag_color = "yellow"  # Yellow for economy processing
                else:
                    updated_memo = f"{memo} AI smart".strip()
                    flag_color = "orange"  # Orange for smart processing

                path = f"budgets/{budget_uuid}/transactions/{transaction_id}"
                body = {
                    "transaction": {
                        "category_id": suggested_category["uuid"],
                        "approved": True,
                        "flag_color": flag_color,
                        "memo": updated_memo
                    }
                }
                result = fetch("PUT", path, body)
                if "error" not in result:
                    updated_transactions.append({
                        "transaction_id": transaction_id,
                        "status": "updated",
                        "suggested_category": suggested_category_name,
                        "memo": updated_memo,
                        "processing_type": urgency
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
            "total_failed": len(failed_transactions),
            "processing_type": urgency
        }

    except Exception as e:
        logging.error(f"Error in apply_suggested_categories_smart_service: {e}")
        raise


def suggest_categories_only_smart_service(budget_uuid, urgency="normal"):
    """
    Smart category suggestion without updating YNAB - for preview/review.
    
    urgency options:
    - "immediate": Force real-time processing (expensive but fast)
    - "normal": Auto-choose based on transaction count
    - "economy": Force batch processing (cheap but slow)
    """
    try:
        # Fetch budget ID and uncategorized transactions
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)

        if not uncategorized_transactions:
            return {"message": "No uncategorized transactions found"}

        transaction_count = len(uncategorized_transactions)
        logging.info(f"Smart suggesting categories for {transaction_count} transactions with urgency='{urgency}'")
        
        # Use smart processing to get all category suggestions
        category_suggestions = suggest_categories_smart(uncategorized_transactions, categories, urgency, budget_uuid)
        
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
            "total_processed": len(uncategorized_transactions),
            "processing_type": urgency
        }

    except Exception as e:
        logging.error(f"Error in suggest_categories_only_smart_service: {e}")
        raise


def apply_all_categories_service(budget_uuid, transactions_with_categories):
    """
    Apply all categories (both AI suggestions and manual changes) to YNAB transactions.
    Learn from manual changes by saving them as payee mappings.
    """
    try:
        # Fetch original uncategorized transactions to compare with frontend state
        budget_id = get_objectid_for_budget(budget_uuid)
        original_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)
        
        # Create mapping for easy lookup
        original_transactions_map = {tx["id"]: tx for tx in original_transactions}
        
        # Initialize payee mappings manager for learning
        mappings_manager = MongoPayeeMappingsManager(budget_uuid)
        
        updated_transactions = []
        failed_transactions = []
        learned_mappings = 0

        for frontend_transaction in transactions_with_categories:
            try:
                transaction_id = frontend_transaction["transaction_id"]
                suggested_category_name = frontend_transaction["suggested_category_name"]
                
                # Find original transaction
                original_transaction = original_transactions_map.get(transaction_id)
                if not original_transaction:
                    logging.warning(f"Original transaction not found: {transaction_id}")
                    failed_transactions.append({
                        "transaction_id": transaction_id,
                        "error": "Original transaction not found"
                    })
                    continue

                # Check if this was manually changed (use frontend flag to avoid unnecessary AI calls)
                is_manual_change = frontend_transaction.get("is_manual_change", False)
                
                # If no flag provided, fall back to cache comparison (avoid expensive AI call)
                if "is_manual_change" not in frontend_transaction:
                    try:
                        from .ai_suggestions_simple import SimpleAISuggestionsService
                        cache_service = SimpleAISuggestionsService(budget_uuid)
                        cached_suggestion = cache_service.get_cached_suggestion(transaction_id)
                        is_manual_change = cached_suggestion and cached_suggestion != suggested_category_name
                        logging.info(f"Determined manual change via cache: {is_manual_change} (cached: {cached_suggestion}, current: {suggested_category_name})")
                    except Exception as e:
                        logging.warning(f"Could not determine manual change via cache: {e}, assuming manual")
                        is_manual_change = True
                
                # Handle special cases: "Ready to Assign" and "Uncategorized" should be skipped
                if suggested_category_name in ["Ready to Assign", "Uncategorized"]:
                    logging.info(f"Skipping transaction {transaction_id} - AI suggested '{suggested_category_name}' (keeping uncategorized)")
                    continue
                
                # Find the matching category
                suggested_category = next(
                    (cat for cat in categories if cat["name"] == suggested_category_name), None
                )

                if not suggested_category:
                    logging.warning(f"Category '{suggested_category_name}' not found for transaction: {transaction_id}")
                    failed_transactions.append({
                        "transaction_id": transaction_id,
                        "error": f"Category '{suggested_category_name}' not found"
                    })
                    continue

                # If this is a manual change, learn it as a payee mapping
                if is_manual_change:
                    try:
                        payee_name = original_transaction["payee_name"]
                        mappings_manager.add_mapping(payee_name, suggested_category_name)
                        learned_mappings += 1
                        logging.info(f"Learned mapping: '{payee_name}' → '{suggested_category_name}'")
                    except Exception as e:
                        logging.warning(f"Failed to save payee mapping for {payee_name}: {e}")

                # Update transaction in YNAB
                logging.info(f"Updating transaction {transaction_id} with category {suggested_category['name']} ({'manual' if is_manual_change else 'AI'})")
                
                # Ensure memo is a string
                memo = original_transaction.get("memo") or ""
                if is_manual_change:
                    updated_memo = f"{memo} Manual categorization".strip()
                    flag_color = "purple"  # Purple for manual changes
                else:
                    updated_memo = f"{memo} AI suggested".strip()
                    flag_color = "blue"  # Blue for AI suggestions

                path = f"budgets/{budget_uuid}/transactions/{transaction_id}"
                body = {
                    "transaction": {
                        "category_id": suggested_category["uuid"],
                        "approved": True,
                        "flag_color": flag_color,
                        "memo": updated_memo
                    }
                }
                result = fetch("PUT", path, body)
                if "error" not in result:
                    updated_transactions.append({
                        "transaction_id": transaction_id,
                        "status": "updated",
                        "suggested_category": suggested_category_name,
                        "memo": updated_memo,
                        "type": "manual" if is_manual_change else "ai",
                        "learned": is_manual_change
                    })
                else:
                    logging.warning(f"Failed to update transaction {transaction_id}: {result['error']}")
                    failed_transactions.append({
                        "transaction_id": transaction_id,
                        "error": result['error']
                    })

            except Exception as e:
                logging.warning(f"Error processing transaction {frontend_transaction.get('transaction_id', 'unknown')}: {e}")
                failed_transactions.append({
                    "transaction_id": frontend_transaction.get('transaction_id', 'unknown'),
                    "error": str(e)
                })
                continue

        return {
            "updated_transactions": updated_transactions,
            "failed_transactions": failed_transactions,
            "total_processed": len(transactions_with_categories),
            "total_updated": len(updated_transactions),
            "total_failed": len(failed_transactions),
            "learned_mappings": learned_mappings
        }

    except Exception as e:
        logging.error(f"Error in apply_all_categories_service: {e}")
        raise


def get_cached_suggestions_service(budget_uuid):
    """
    Get cached AI suggestions for immediate display using simple cache.
    Returns cached suggestions without making new AI calls.
    """
    try:
        # Get uncategorized transactions
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        
        if not uncategorized_transactions:
            return {
                "suggestions": {}, 
                "cache_stats": {},
                "uncategorized_transactions": [],
                "total_transactions": 0,
                "cached_count": 0,
                "missing_count": 0
            }

        # Initialize simple cache service
        cache_service = SimpleAISuggestionsService(budget_uuid)
        
        # Get transaction IDs
        transaction_ids = [tx["id"] for tx in uncategorized_transactions]
        
        # Get cached suggestions
        cached_suggestions = cache_service.get_cached_suggestions_batch(transaction_ids)
        
        # Format for frontend
        suggestions = {}
        for transaction_id, suggested_category in cached_suggestions.items():
            suggestions[transaction_id] = {
                "suggested_category_name": suggested_category,
                "confidence": 0.8,  # Default confidence
                "cached": True,
                "loading_suggestion": False
            }
        
        # Get cache statistics
        cache_stats = cache_service.get_stats()
        
        logging.info(f"Returned {len(suggestions)} cached suggestions for {len(uncategorized_transactions)} transactions")
        
        return {
            "suggestions": suggestions,
            "cache_stats": cache_stats,
            "uncategorized_transactions": uncategorized_transactions,  # Include transactions for frontend
            "total_transactions": len(uncategorized_transactions),
            "cached_count": len(suggestions),
            "missing_count": len(uncategorized_transactions) - len(suggestions)
        }
        
    except Exception as e:
        logging.error(f"Error in get_cached_suggestions_service: {e}")
        raise


def get_suggestions_async_service(budget_uuid, transaction_ids):
    """
    Get AI suggestions for specific transactions with simple caching.
    Uses cache first, then generates missing suggestions.
    """
    try:
        # Get budget data
        budget_id = get_objectid_for_budget(budget_uuid)
        uncategorized_transactions = get_uncategorized_transactions(budget_uuid)
        categories = get_categories_for_budget(budget_id)
        
        # Filter transactions by requested IDs
        requested_transactions = [
            tx for tx in uncategorized_transactions 
            if tx["id"] in transaction_ids
        ]
        
        if not requested_transactions:
            return {"suggestions": {}, "cached_count": 0, "generated_count": 0}

        # Initialize simple cache service
        cache_service = SimpleAISuggestionsService(budget_uuid)
        
        # Check cache first
        cached_suggestions = cache_service.get_cached_suggestions_batch(transaction_ids)
        
        # Find transactions that need AI suggestions
        missing_transactions = [
            tx for tx in requested_transactions 
            if tx["id"] not in cached_suggestions
        ]
        
        suggestions = {}
        generated_count = 0
        
        # Add cached suggestions
        for transaction_id, suggested_category in cached_suggestions.items():
            suggestions[transaction_id] = {
                "suggested_category_name": suggested_category,
                "confidence": 0.8,
                "cached": True,
                "loading_suggestion": False
            }
        
        # Generate missing suggestions
        if missing_transactions:
            logging.info(f"Generating AI suggestions for {len(missing_transactions)} transactions")
            
            new_suggestions = []
            
            # Use batch processing for efficiency
            if len(missing_transactions) > 5:
                # Use batch API for larger sets
                try:
                    batch_suggestions = suggest_categories_batch(missing_transactions, categories, budget_uuid)
                    
                    for transaction in missing_transactions:
                        transaction_id = transaction["id"]
                        suggested_category = batch_suggestions.get(transaction_id)
                        
                        if suggested_category:
                            suggestions[transaction_id] = {
                                "suggested_category_name": suggested_category,
                                "confidence": 0.8,
                                "cached": False,
                                "loading_suggestion": False
                            }
                            
                            # Prepare for caching
                            new_suggestions.append({
                                "transaction_id": transaction_id,
                                "payee_name": transaction["payee_name"],
                                "suggested_category": suggested_category,
                                "confidence": 0.8
                            })
                            generated_count += 1
                            
                except Exception as e:
                    logging.warning(f"Batch processing failed, falling back to individual calls: {e}")
                    # Fall back to individual processing
                    missing_transactions = [tx for tx in missing_transactions if tx["id"] not in suggestions]
            
            # Process remaining transactions individually
            for transaction in missing_transactions:
                if transaction["id"] in suggestions:
                    continue
                    
                try:
                    suggested_category = suggest_category(transaction, categories, budget_uuid)
                    transaction_id = transaction["id"]
                    
                    suggestions[transaction_id] = {
                        "suggested_category_name": suggested_category,
                        "confidence": 0.8,
                        "cached": False,
                        "loading_suggestion": False
                    }
                    
                    # Prepare for caching
                    new_suggestions.append({
                        "transaction_id": transaction_id,
                        "payee_name": transaction["payee_name"],
                        "suggested_category": suggested_category,
                        "confidence": 0.8
                    })
                    generated_count += 1
                    
                except Exception as e:
                    logging.warning(f"Failed to generate suggestion for transaction {transaction['id']}: {e}")
                    # Return loading state for failed transactions
                    suggestions[transaction["id"]] = {
                        "suggested_category_name": None,
                        "confidence": 0.0,
                        "cached": False,
                        "loading_suggestion": False,
                        "error": "Failed to generate suggestion"
                    }
            
            # Cache new suggestions
            if new_suggestions:
                cached_count = cache_service.store_suggestions_batch(new_suggestions)
                logging.info(f"Cached {cached_count} new suggestions in local database")
        
        return {
            "suggestions": suggestions,
            "cached_count": len(cached_suggestions),
            "generated_count": generated_count,
            "total_requested": len(transaction_ids),
            "total_returned": len(suggestions)
        }
        
    except Exception as e:
        logging.error(f"Error in get_suggestions_async_service: {e}")
        raise
