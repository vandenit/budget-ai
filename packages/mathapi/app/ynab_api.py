import os
import requests

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Fetch the YNAB access token and base URL
YNAB_ACCESS_TOKEN = os.getenv("YNAB_ACCESS_TOKEN")
YNAB_BASE_URL = os.getenv("YNAB_BASE_URL")

def fetch(method, path, body=None):
    """Performs an HTTP request to the YNAB API with the specified method and path."""
    
    # Define the full URL by combining the base URL and path
    url = f"{YNAB_BASE_URL}{path}"
    headers = {
        "Authorization": f"Bearer {YNAB_ACCESS_TOKEN}"
    }

    try:
        # Send the request using the specified HTTP method
        print(f"Fetching data from {url} using method: {method}")
        response = requests.request(method, url, headers=headers, json=body)
        response.raise_for_status()  # Raise an HTTPError for bad responses

        # Return the parsed JSON response
        return response.json()
    
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred: {http_err}")
        return {"error": f"HTTP error occurred: {http_err}"}
    except Exception as err:
        print(f"An error occurred: {err}")
        return {"error": "An unexpected error occurred"}

def get_scheduled_transactions(budget_id):
    """Fetches scheduled transactions for a given budget ID from the YNAB API."""
    
    if not budget_id:
        raise ValueError("A budget ID is required")

    # Define the path for scheduled transactions and use the fetch function
    path = f"budgets/{budget_id}/scheduled_transactions"
    result = fetch("GET", path)
    
    # Extract only the scheduled transactions data if no error occurred
    if "error" not in result:
        return result.get("data", {}).get("scheduled_transactions", [])
    else:
        return result

def get_uncategorized_transactions(budget_id):
    """Fetch uncategorized transactions for a given budget ID."""
    if not budget_id:
        raise ValueError("A budget ID is required")

    # Define the path for uncategorized transactions
    path = f"budgets/{budget_id}/transactions?type=uncategorized"
    result = fetch("GET", path)
    # filter out tranfers with Pyaee name "Transfer :"
    return [transaction for transaction in result.get("data", {}).get("transactions", []) if not transaction["payee_name"].startswith("Transfer :")]

def get_unapproved_transactions(budget_id):
    """Fetch unapproved transactions for a given budget ID."""
    if not budget_id:
        raise ValueError("A budget ID is required")

    # Get all transactions and filter for unapproved ones
    path = f"budgets/{budget_id}/transactions"
    result = fetch("GET", path)
    all_transactions = result.get("data", {}).get("transactions", [])
    
    # Filter for unapproved transactions (excluding transfers)
    unapproved = []
    for transaction in all_transactions:
        # Handle None payee_name safely
        payee_name = transaction.get("payee_name") or ""
        
        if payee_name.startswith("Transfer :"):
            continue  # Skip transfers
            
        # Check if transaction needs approval
        is_approved = transaction.get("approved", True)  # Default to True if not specified
        
        if not is_approved:
            unapproved.append(transaction)
    
    return unapproved 