from datetime import datetime, timedelta
from dotenv import load_dotenv
from budget_api import get_objectid_for_budget, convert_objectid_to_str
from db import get_DB
import logging

# Load environment variables from .env file
load_dotenv()

def get_categories_for_budget(budget_id):
    query = {
        "budgetId": budget_id
    }
    # Execute the query and retrieve categories from localcategories
    categories = get_DB().localcategories.find(query)
    categories_list = []
    for category in categories:
        categories_list.append(convert_objectid_to_str(category))
    return categories_list

    """Fetch uncategorized transactions for a given budget ID."""
    if not budget_id:
        raise ValueError("A budget ID is required")

    # Define the path for uncategorized transactions
    path = f"/budgets/{budget_id}/transactions?type=uncategorized"
    result = fetch("GET", path)

    # Return uncategorized transactions directly from the API response
    if "error" not in result:
        return result.get("data", {}).get("transactions", [])
    else:
        return result