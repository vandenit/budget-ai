import os
import json
import time
from io import BytesIO
from openai import OpenAI

from dotenv import load_dotenv

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

def suggest_category(transaction, categories):
    """Suggest a category for a transaction using OpenAI."""
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
        
    category_names = ", ".join([category["name"] for category in categories])
    prompt = f"""
    Suggest the most suitable category for the following transaction based on these available categories: {category_names}.
    Special cases:
    - 'Afrekening op" means kbc krediet.
    - Kbc business => Unexpected
    - Ava => Unexpected
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
    print(response.choices[0].message.content.strip())
    return response.choices[0].message.content.strip()


def create_batch_tasks_for_categories(transactions, categories):
    """Create batch tasks for multiple transaction categorizations."""
    category_names = ", ".join([category["name"] for category in categories])
    
    tasks = []
    for index, transaction in enumerate(transactions):
        prompt = f"""
        Suggest the most suitable category for the following transaction based on these available categories: {category_names}.
        Special cases:
        - 'Afrekening op" means kbc krediet.
        - Kbc business => Unexpected
        - Ava => Unexpected
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


def parse_category_suggestions(batch_results, transactions):
    """Parse batch results and match them back to transactions."""
    suggestions = {}
    
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
                suggestions[transaction_id] = suggested_category
            else:
                print(f"No valid response for transaction {transaction_id}")
                suggestions[transaction_id] = None
        
        except Exception as e:
            print(f"Error parsing result: {e}")
            continue
    
    return suggestions


def suggest_categories_batch(transactions, categories):
    """
    Suggest categories for multiple transactions using batch processing.
    Returns a dictionary mapping transaction IDs to suggested categories.
    """
    if not transactions:
        return {}
    
    # Create batch tasks
    tasks = create_batch_tasks_for_categories(transactions, categories)
    
    # Submit batch job
    batch_job = submit_batch_job(tasks, f"Categorize {len(transactions)} transactions")
    
    if not batch_job:
        print("Failed to create batch job")
        return {}
    
    print(f"Batch job {batch_job.id} submitted. Waiting for completion...")
    
    # Wait for completion (non-blocking in production, you'd typically store the batch_id and check later)
    completed_job = wait_for_batch_completion(batch_job.id)
    
    if not completed_job or completed_job.status != "completed":
        print("Batch job did not complete successfully")
        return {}
    
    # Retrieve and parse results
    batch_results = retrieve_batch_results(completed_job)
    suggestions = parse_category_suggestions(batch_results, transactions)
    
    return suggestions


def suggest_categories_batch_async(transactions, categories):
    """
    Start a batch job for category suggestions but don't wait for completion.
    Returns the batch job ID for later status checking.
    """
    if not transactions:
        return None
    
    # Create batch tasks
    tasks = create_batch_tasks_for_categories(transactions, categories)
    
    # Submit batch job
    batch_job = submit_batch_job(tasks, f"Categorize {len(transactions)} transactions (async)")
    
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


def suggest_categories_smart(transactions, categories, urgency="normal"):
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
        return suggest_categories_realtime_batch(transactions, categories)
    
    elif urgency == "economy":
        # Force batch API regardless of count
        print(f"Using batch API for {transaction_count} transactions (economy)")
        return suggest_categories_batch(transactions, categories)
    
    else:
        # Auto-choose based on transaction count (normal urgency)
        if transaction_count <= 5:
            print(f"Using real-time processing for {transaction_count} transactions (auto: small batch)")
            return suggest_categories_realtime_batch(transactions, categories)
        elif transaction_count > 20:
            print(f"Using batch API for {transaction_count} transactions (auto: large batch)")
            return suggest_categories_batch(transactions, categories)
        else:
            print(f"Using parallel real-time processing for {transaction_count} transactions (auto: medium batch)")
            return suggest_categories_parallel_realtime(transactions, categories)


def suggest_categories_realtime_batch(transactions, categories):
    """
    Process transactions one-by-one using real-time API.
    Fast but more expensive.
    """
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
    
    suggestions = {}
    total = len(transactions)
    
    for i, transaction in enumerate(transactions):
        try:
            print(f"Processing transaction {i+1}/{total}: {transaction['payee_name']}")
            suggested_category = suggest_category(transaction, categories)
            suggestions[transaction['id']] = suggested_category
        except Exception as e:
            print(f"Error processing transaction {transaction['id']}: {e}")
            suggestions[transaction['id']] = None
    
    return suggestions


def suggest_categories_parallel_realtime(transactions, categories):
    """
    Process transactions in parallel using real-time API with threading.
    Balance between speed and cost.
    """
    if not client:
        raise Exception("OpenAI client not initialized - API key missing")
    
    import concurrent.futures
    import threading
    
    suggestions = {}
    suggestions_lock = threading.Lock()
    
    def process_transaction(transaction):
        try:
            suggested_category = suggest_category(transaction, categories)
            with suggestions_lock:
                suggestions[transaction['id']] = suggested_category
            print(f"✓ Processed: {transaction['payee_name']} -> {suggested_category}")
        except Exception as e:
            print(f"✗ Error processing {transaction['payee_name']}: {e}")
            with suggestions_lock:
                suggestions[transaction['id']] = None
    
    # Process transactions in parallel (max 3 concurrent to respect rate limits)
    max_workers = min(3, len(transactions))
    print(f"Processing {len(transactions)} transactions with {max_workers} parallel workers")
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [executor.submit(process_transaction, transaction) for transaction in transactions]
        concurrent.futures.wait(futures)
    
    return suggestions
