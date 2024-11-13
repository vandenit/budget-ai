from datetime import datetime, timedelta
from dotenv import load_dotenv
from budget_api import get_objectid_for_budget, convert_objectid_to_str
from db import get_DB
import logging

# Load environment variables from .env file
load_dotenv()

def get_accounts_for_budget(budget_id):
    query = {
        "budgetId": budget_id
    }
    # Execute the query and retrieve categories from localcategories
    accounts = get_DB().localaccounts.find(query)
    account_list = []
    for account in accounts:
        account_list.append(convert_objectid_to_str(account))
    return account_list
