import os
import json
import time
import logging
from io import BytesIO
from openai import OpenAI

from dotenv import load_dotenv
from .payee_mappings_mongo import MongoPayeeMappingsManager

# Load environment variables from .env file
load_dotenv()

# Initialize OpenAI client with fallback for testing
def get_openai_client():
    api_key = os.getenv("AI_OPENAI_API_KEY")
    if not api_key:
        # For testing purposes, create a mock client
        return None
    return OpenAI(api_key=api_key)

# Global client instance (will be None during testing without API key)
client = get_openai_client()

# Fetch the YNAB access token and base URL

def suggest_category(transaction, categories, budget_uuid=None):
    """Suggest a category for a transaction using OpenAI with payee mappings."""
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
    
    # Check for known payee mappings first (fast and free!)
    if budget_uuid:
        mappings_manager = MongoPayeeMappingsManager(budget_uuid)
        mapping_result = mappings_manager.get_mapping_with_fallback(transaction['payee_name'])
        
        if mapping_result:
            category, match_type, matched_payee = mapping_result
            print(f"🎯 Found {match_type} mapping: '{transaction['payee_name']}' → '{category}' (matched: '{matched_payee}')")
            return category
        
        # Get known mappings for prompt context
        mappings_context = mappings_manager.get_mappings_for_prompt()
    else:
        mappings_context = ""
    
    category_names = ", ".join([category["name"] for category in categories])
    prompt = f"""
    Suggest the most suitable category for the following transaction based on these available categories: {category_names}.
    Special cases:
    - 'Afrekening op" means KBC credit.
    - Kbc business => Unexpected
    - Ava => Unexpected
    {mappings_context}
    Transaction Details:
    - Description: {transaction['payee_name']}
    - Amount: {transaction['amount']}
    - Date: {transaction['date']}

    Return only the name of the category.
    """
    print(prompt)
    response = client.chat.completions.create(model="gpt-4",
    messages=[{"role": "user", "content": prompt}],
    temperature=0.2)
    suggested_category = response.choices[0].message.content.strip()
    print(suggested_category)
    
    # Validate that the suggested category exists in available categories
    category_names = [category["name"] for category in categories]
    if suggested_category not in category_names:
        logging.warning(f"AI suggested invalid category '{suggested_category}' for payee '{transaction['payee_name']}'. Available: {category_names}")
        
        # Try to find a close match (case-insensitive)
        suggested_lower = suggested_category.lower()
        for category_name in category_names:
            if category_name.lower() == suggested_lower:
                logging.info(f"Found case-insensitive match: '{suggested_category}' → '{category_name}'")
                suggested_category = category_name
                break
        else:
            # No close match found - return "Uncategorized" as fallback
            logging.warning(f"No match found for '{suggested_category}', defaulting to 'Uncategorized'")
            suggested_category = "Uncategorized"
    
    # Optional: Learn from this interaction if we want auto-learning
    # if budget_uuid:
    #     mappings_manager.learn_from_transaction_update(
    #         transaction['payee_name'], 
    #         suggested_category, 
    #         auto_learn=False  # Set to True for automatic learning
    #     )
    
    return suggested_category


def create_batch_tasks_for_categories(transactions, categories, budget_uuid=None):
    """Create batch tasks for multiple transaction categorizations with payee mappings."""
    # Get mappings context if budget_uuid is provided
    mappings_context = ""
    if budget_uuid:
        mappings_manager = MongoPayeeMappingsManager(budget_uuid)
        mappings_context = mappings_manager.get_mappings_for_prompt()
    
    category_names = ", ".join([category["name"] for category in categories])
    
    tasks = []
    for index, transaction in enumerate(transactions):
        prompt = f"""
        Suggest the most suitable category for the following transaction based on these available categories: {category_names}.
        Special cases:
        - 'Afrekening op" means KBC credit.
        - Kbc business => Unexpected
        - Ava => Unexpected
        {mappings_context}
        Transaction Details:
        - Description: {transaction['payee_name']}
        - Amount: {transaction['amount']}
        - Date: {transaction['date']}

        Return only the name of the category.
        """
        
        task = {
            "custom_id": f"transaction-{transaction['id']}-{index}",
            "method": "POST",
            "url": "/v1/chat/completions",
            "body": {
                "model": "gpt-4o-mini",
                "temperature": 0.2,
                "messages": [
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
            }
        }
        tasks.append(task)
    
    return tasks


def submit_batch_job(tasks, job_description="Transaction categorization"):
    """Submit a batch job to OpenAI using in-memory file handling."""
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
        
    # Create JSONL content in memory
    jsonl_content = ""
    for task in tasks:
        jsonl_content += json.dumps(task) + '\n'
    
    # Convert to bytes and create BytesIO object
    jsonl_bytes = jsonl_content.encode('utf-8')
    file_obj = BytesIO(jsonl_bytes)
    
    # Set a filename for the BytesIO object (required by OpenAI API)
    file_obj.name = f"batch_tasks_{int(time.time())}.jsonl"
    
    try:
        # Upload the file (no disk I/O needed!)
        batch_file = client.files.create(
            file=file_obj,
            purpose="batch"
        )
        
        # Create the batch job
        batch_job = client.batches.create(
            input_file_id=batch_file.id,
            endpoint="/v1/chat/completions",
            completion_window="24h",
            metadata={
                "description": job_description
            }
        )
        
        print(f"Batch job created with ID: {batch_job.id}")
        return batch_job
    
    except Exception as e:
        print(f"Error creating batch job: {e}")
        return None
    
    finally:
        # Close the BytesIO object (no file cleanup needed)
        file_obj.close()


def check_batch_status(batch_id):
    """Check the status of a batch job."""
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
    batch_job = client.batches.retrieve(batch_id)
    return batch_job


def wait_for_batch_completion(batch_id, max_wait_time=86400):  # 24 hours max
    """Wait for batch job completion with timeout."""
    start_time = time.time()
    
    while time.time() - start_time < max_wait_time:
        batch_job = client.batches.retrieve(batch_id)
        
        if batch_job.status == "completed":
            print(f"Batch job {batch_id} completed successfully")
            return batch_job
        elif batch_job.status == "failed":
            print(f"Batch job {batch_id} failed")
            return batch_job
        elif batch_job.status == "cancelled":
            print(f"Batch job {batch_id} was cancelled")
            return batch_job
        
        print(f"Batch job {batch_id} status: {batch_job.status}")
        time.sleep(30)  # Check every 30 seconds
    
    print(f"Batch job {batch_id} timed out after {max_wait_time} seconds")
    return None


def retrieve_batch_results(batch_job):
    """Retrieve and parse batch job results using in-memory processing."""
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
        
    if not batch_job.output_file_id:
        print("No output file available")
        return []
    
    try:
        # Download the results directly as bytes
        result_content = client.files.content(batch_job.output_file_id).content
        result_data = result_content.decode('utf-8')
        
        # Parse the JSONL results directly in memory
        results = []
        for line in result_data.strip().split('\n'):
            if line.strip():
                try:
                    result_obj = json.loads(line)
                    results.append(result_obj)
                except json.JSONDecodeError as e:
                    print(f"Error parsing line: {line[:100]}... - {e}")
                    continue
        
        print(f"Successfully parsed {len(results)} batch results")
        return results
    
    except Exception as e:
        print(f"Error retrieving batch results: {e}")
        return []


def parse_category_suggestions(batch_results, transactions, categories=None):
    """Parse batch results and match them back to transactions."""
    suggestions = {}
    
    # Create category names list for validation
    category_names = [category["name"] for category in categories] if categories else []
    
    for result in batch_results:
        try:
            custom_id = result['custom_id']
            # Extract transaction ID from custom_id (format: "transaction-{id}-{index}")
            # Split and rejoin to handle IDs with dashes like "txn-1"
            parts = custom_id.split('-')
            if len(parts) >= 3:
                # Rejoin all parts except first (transaction) and last (index)
                transaction_id = '-'.join(parts[1:-1])
            else:
                # Fallback for simple format
                transaction_id = parts[1] if len(parts) > 1 else custom_id
            
            if 'response' in result and 'body' in result['response']:
                suggested_category = result['response']['body']['choices'][0]['message']['content'].strip()
                
                # Validate category if categories provided
                if categories and suggested_category not in category_names:
                    logging.warning(f"Batch AI suggested invalid category '{suggested_category}'. Available: {category_names}")
                    
                    # Try to find a close match (case-insensitive)
                    suggested_lower = suggested_category.lower()
                    for category_name in category_names:
                        if category_name.lower() == suggested_lower:
                            logging.info(f"Found case-insensitive match: '{suggested_category}' → '{category_name}'")
                            suggested_category = category_name
                            break
                    else:
                        # No close match found - return "Uncategorized" as fallback
                        logging.warning(f"No match found for '{suggested_category}', defaulting to 'Uncategorized'")
                        suggested_category = "Uncategorized"
                
                suggestions[transaction_id] = suggested_category
            else:
                print(f"No valid response for transaction {transaction_id}")
                suggestions[transaction_id] = None
        
        except Exception as e:
            print(f"Error parsing result: {e}")
            continue
    
    return suggestions


def suggest_categories_batch(transactions, categories, budget_uuid=None):
    """
    Suggest categories for multiple transactions using batch processing.
    Returns a dictionary mapping transaction IDs to suggested categories.
    """
    if not transactions:
        return {}
    
    # Check for known mappings first (fast and free!)
    suggestions = {}
    remaining_transactions = []
    
    if budget_uuid:
        mappings_manager = MongoPayeeMappingsManager(budget_uuid)
        
        for transaction in transactions:
            mapping_result = mappings_manager.get_mapping_with_fallback(transaction['payee_name'])
            if mapping_result:
                category, match_type, matched_payee = mapping_result
                suggestions[transaction['id']] = category
                print(f"🎯 Pre-mapped {match_type}: '{transaction['payee_name']}' → '{category}'")
            else:
                remaining_transactions.append(transaction)
    else:
        remaining_transactions = transactions
    
    # If all transactions were mapped, return early
    if not remaining_transactions:
        print(f"✅ All {len(transactions)} transactions resolved via mappings!")
        return suggestions
    
    print(f"📋 Processing {len(remaining_transactions)} unmapped transactions via batch API...")
    
    # Create batch tasks for remaining transactions
    tasks = create_batch_tasks_for_categories(remaining_transactions, categories, budget_uuid)
    
    # Submit batch job
    batch_job = submit_batch_job(tasks, f"Categorize {len(remaining_transactions)} transactions")
    
    if not batch_job:
        print("Failed to create batch job")
        return suggestions
    
    print(f"Batch job {batch_job.id} submitted. Waiting for completion...")
    
    # Wait for completion
    completed_job = wait_for_batch_completion(batch_job.id)
    
    if not completed_job or completed_job.status != "completed":
        print("Batch job did not complete successfully")
        return suggestions
    
    # Retrieve and parse results
    batch_results = retrieve_batch_results(completed_job)
    batch_suggestions = parse_category_suggestions(batch_results, remaining_transactions, categories)
    
    # Combine pre-mapped and batch suggestions
    suggestions.update(batch_suggestions)
    
    return suggestions


def suggest_categories_batch_async(transactions, categories, budget_uuid=None):
    """
    Start a batch job for category suggestions but don't wait for completion.
    Returns the batch job ID for later status checking.
    """
    if not transactions:
        return None
    
    # Check for known mappings first
    remaining_transactions = []
    mapped_count = 0
    
    if budget_uuid:
        mappings_manager = MongoPayeeMappingsManager(budget_uuid)
        
        for transaction in transactions:
            mapping_result = mappings_manager.get_mapping_with_fallback(transaction['payee_name'])
            if mapping_result:
                mapped_count += 1
                print(f"🎯 Pre-mapped: '{transaction['payee_name']}' → '{mapping_result[0]}'")
            else:
                remaining_transactions.append(transaction)
    else:
        remaining_transactions = transactions
    
    if not remaining_transactions:
        print(f"✅ All {len(transactions)} transactions resolved via mappings!")
        return "all-mapped"  # Special return value
    
    print(f"📋 Starting batch job for {len(remaining_transactions)} unmapped transactions (mapped: {mapped_count})...")
    
    # Create batch tasks for remaining transactions
    tasks = create_batch_tasks_for_categories(remaining_transactions, categories, budget_uuid)
    
    # Submit batch job
    batch_job = submit_batch_job(tasks, f"Categorize {len(remaining_transactions)} transactions (async)")
    
    if not batch_job:
        print("Failed to create batch job")
        return None
    
    print(f"Batch job {batch_job.id} submitted. You can check status later.")
    return batch_job.id


def get_batch_status_and_results(batch_id):
    """
    Check batch status and retrieve results if completed.
    Returns: (status, results, error_message)
    """
    if not client:
        return ("error", None, "OpenAI client not initialized - API key missing")
        
    try:
        batch_job = client.batches.retrieve(batch_id)
        
        if batch_job.status == "completed":
            # Retrieve and parse results
            batch_results = retrieve_batch_results(batch_job)
            return ("completed", batch_results, None)
        elif batch_job.status == "failed":
            return ("failed", None, "Batch job failed")
        elif batch_job.status == "cancelled":
            return ("cancelled", None, "Batch job was cancelled")
        else:
            # Still processing (validating, in_progress, finalizing)
            return (batch_job.status, None, None)
    
    except Exception as e:
        return ("error", None, str(e))


def cancel_batch_job(batch_id):
    """Cancel a batch job if it hasn't completed yet."""
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
        
    try:
        batch_job = client.batches.cancel(batch_id)
        return batch_job
    except Exception as e:
        print(f"Error cancelling batch job: {e}")
        return None


def suggest_categories_smart(transactions, categories, urgency="normal", budget_uuid=None):
    """
    Smart category suggestion that chooses the best approach based on context.
    
    urgency options:
    - "immediate": Force real-time processing (expensive but fast)
    - "normal": Auto-choose based on transaction count  
    - "economy": Force batch processing (cheap but slow)
    """
    if not transactions:
        return {}
    
    transaction_count = len(transactions)
    
    # Decision logic - urgency takes priority
    if urgency == "immediate":
        # Force real-time processing regardless of count
        print(f"Using real-time processing for {transaction_count} transactions (urgent)")
        return suggest_categories_realtime_batch(transactions, categories, budget_uuid)
    
    elif urgency == "economy":
        # Force batch API regardless of count
        print(f"Using batch API for {transaction_count} transactions (economy)")
        return suggest_categories_batch(transactions, categories, budget_uuid)
    
    else:
        # Auto-choose based on transaction count (normal urgency)
        if transaction_count <= 5:
            print(f"Using real-time processing for {transaction_count} transactions (auto: small batch)")
            return suggest_categories_realtime_batch(transactions, categories, budget_uuid)
        elif transaction_count > 20:
            print(f"Using batch API for {transaction_count} transactions (auto: large batch)")
            return suggest_categories_batch(transactions, categories, budget_uuid)
        else:
            print(f"Using parallel real-time processing for {transaction_count} transactions (auto: medium batch)")
            return suggest_categories_parallel_realtime(transactions, categories, budget_uuid)


def suggest_categories_realtime_batch(transactions, categories, budget_uuid=None):
    """
    Process transactions one-by-one using real-time API with payee mappings.
    Fast but more expensive.
    """
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
    
    suggestions = {}
    remaining_transactions = []
    
    # Check for known mappings first (fast and free!)
    if budget_uuid:
        mappings_manager = MongoPayeeMappingsManager(budget_uuid)
        
        for transaction in transactions:
            mapping_result = mappings_manager.get_mapping_with_fallback(transaction['payee_name'])
            if mapping_result:
                category, match_type, matched_payee = mapping_result
                suggestions[transaction['id']] = category
                print(f"🎯 Pre-mapped {match_type}: '{transaction['payee_name']}' → '{category}'")
            else:
                remaining_transactions.append(transaction)
    else:
        remaining_transactions = transactions
    
    # Process remaining transactions via OpenAI API
    total = len(remaining_transactions)
    for i, transaction in enumerate(remaining_transactions):
        try:
            print(f"Processing transaction {i+1}/{total}: {transaction['payee_name']}")
            suggested_category = suggest_category(transaction, categories, budget_uuid)
            suggestions[transaction['id']] = suggested_category
        except Exception as e:
            print(f"Error processing transaction {transaction['id']}: {e}")
            suggestions[transaction['id']] = None
    
    print(f"✅ Processed {len(transactions)} transactions: {len(suggestions) - len(remaining_transactions)} mapped, {len(remaining_transactions)} via API")
    return suggestions


def suggest_categories_parallel_realtime(transactions, categories, budget_uuid=None):
    """
    Process transactions in parallel using real-time API with threading and payee mappings.
    Balance between speed and cost.
    """
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
    
    import concurrent.futures
    import threading
    
    suggestions = {}
    suggestions_lock = threading.Lock()
    remaining_transactions = []
    
    # Check for known mappings first (fast and free!)
    if budget_uuid:
        mappings_manager = MongoPayeeMappingsManager(budget_uuid)
        
        for transaction in transactions:
            mapping_result = mappings_manager.get_mapping_with_fallback(transaction['payee_name'])
            if mapping_result:
                category, match_type, matched_payee = mapping_result
                with suggestions_lock:
                    suggestions[transaction['id']] = category
                print(f"🎯 Pre-mapped {match_type}: '{transaction['payee_name']}' → '{category}'")
            else:
                remaining_transactions.append(transaction)
    else:
        remaining_transactions = transactions
    
    # Process remaining transactions in parallel
    def process_transaction(transaction):
        try:
            suggested_category = suggest_category(transaction, categories, budget_uuid)
            with suggestions_lock:
                suggestions[transaction['id']] = suggested_category
            print(f"✓ Processed: {transaction['payee_name']} → {suggested_category}")
        except Exception as e:
            print(f"✗ Error processing {transaction['payee_name']}: {e}")
            with suggestions_lock:
                suggestions[transaction['id']] = None
    
    if remaining_transactions:
        # Process transactions in parallel (max 3 concurrent to respect rate limits)
        max_workers = min(3, len(remaining_transactions))
        print(f"Processing {len(remaining_transactions)} unmapped transactions with {max_workers} parallel workers")
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(process_transaction, transaction) for transaction in remaining_transactions]
            concurrent.futures.wait(futures)
    
    print(f"✅ Processed {len(transactions)} transactions: {len(suggestions) - len(remaining_transactions)} mapped, {len(remaining_transactions)} via API")
    return suggestions
