import os
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv("MONGODB_URI")
client = MongoClient(MONGODB_URI)
db = client["test"]  # Replace with the actual database name

def get_objectid_for_budget(uuid):
    """
    Fetches the ObjectId for a given budget UUID in the localBudgets collection.

    Args:
        uuid (str): The UUID of the budget.

    Returns:
        ObjectId or None: The ObjectId associated with the budget UUID, or None if not found.
    """
    budget = db.localbudgets.find_one({"uuid": uuid})
    return budget["_id"] if budget else None

def convert_objectid_to_str(doc):
    """Recursively converts ObjectId fields in a document to strings."""
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, dict):
            convert_objectid_to_str(value)
    return doc

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
    transactions = db.localtransactions.find(query)
    transactions_list = []
    logging.info(f"Found {len(transactions_list)} transactions")
    for transaction in transactions:
        transactions_list.append(convert_objectid_to_str(transaction))
    return transactions_list
