from datetime import datetime, timedelta
from dotenv import load_dotenv
from budget_api import get_objectid_for_budget, convert_objectid_to_str
from db import get_DB
import logging

# Load environment variables from .env file
load_dotenv()

def get_local_transactions_last_x_days(uuid, x_days):
    """
    Fetches local transactions from MongoDB for the given budget UUID in the last x days.
    """
    # Retrieve the ObjectId for the budget UUID
    budget_id = get_objectid_for_budget(uuid)

    if not budget_id:
        logging.info(f"No budget found with UUID: {uuid}")
        return []

    logging.info(f"Found ObjectId for budget UUID {uuid}: {budget_id}")

    # Calculate the start date as x days ago
    start_date = (datetime.now() - timedelta(days=x_days)).strftime("%Y-%m-%d")
    logging.debug(f"Start Date: {start_date}")

    # Query the localtransactions collection using the found ObjectId
    query = {
        "budgetId": budget_id,
        "date": {"$gte": start_date}
    }
    logging.debug(f"Query: {query}")

    # Execute the query and retrieve transactions from localtransactions
    transactions = get_DB().localtransactions.find(query)
    transactions_list = []
    for transaction in transactions:
        transactions_list.append(convert_objectid_to_str(transaction))
    return transactions_list
