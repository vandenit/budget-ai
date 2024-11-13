from db import get_DB
from bson import ObjectId

def convert_objectid_to_str(doc):
    """Recursively converts ObjectId fields in a document to strings."""
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, dict):
            convert_objectid_to_str(value)
    return doc

def get_objectid_for_budget(uuid):
    """
    Fetches the ObjectId for a given budget UUID in the localBudgets collection.

    Args:
        uuid (str): The UUID of the budget.

    Returns:
        ObjectId or None: The ObjectId associated with the budget UUID, or None if not found.
    """
    budget = get_DB().localbudgets.find_one({"uuid": uuid})
    return budget["_id"] if budget else None